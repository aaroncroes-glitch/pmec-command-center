-- PMEC client delivery: what a client sees of their project, and the change orders they
-- approve. Applied to the dedicated Supabase project "PMEC Client Delivery".
--
-- Who can do what:
--  * Clients (Supabase Auth users) READ their own client's projects, and only once a PM has
--    published them. Row-level security enforces this; there are no client write policies.
--  * Clients DECIDE change orders only through decide_change_order(), which checks they are
--    an approver for that client and that the order is still pending.
--  * PMs WRITE only through the pm_* functions, called server-side by the Command Center with
--    a token whose hash lives in a schema the API cannot reach.

create extension if not exists pgcrypto with schema extensions;

-- ── Tables ────────────────────────────────────────────────────────────────────────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'approver')),
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);
create index client_members_user_idx on public.client_members(user_id);

-- One row per job order shared with a client; the id is the Command Center job order id.
create table public.projects (
  id text primary key check (length(id) between 1 and 80),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  location text,
  discipline text,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  original_contract_value numeric(14, 2) not null default 0 check (original_contract_value >= 0),
  invoiced_to_date numeric(14, 2) not null default 0 check (invoiced_to_date >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  status_label text not null default 'On programme',
  headline text,
  start_date date,
  target_end_date date,
  published_at timestamptz,
  published_by text,
  updated_at timestamptz not null default now()
);
create index projects_client_idx on public.projects(client_id);

create table public.milestones (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  code text not null,
  title text not null,
  detail text,
  target_date date,
  status text not null check (status in ('complete', 'active', 'upcoming')),
  sort integer not null default 0,
  primary key (project_id, id)
);

create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  number integer not null,
  title text not null check (length(title) between 1 and 200),
  reason text not null check (length(reason) between 1 and 4000),
  amount numeric(14, 2) not null check (amount <> 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  raised_by text not null,
  raised_at timestamptz not null default now(),
  decided_by uuid references auth.users(id) on delete set null,
  decided_by_label text,
  decided_at timestamptz,
  decision_note text check (decision_note is null or length(decision_note) <= 2000),
  unique (project_id, number)
);
create index change_orders_project_idx on public.change_orders(project_id);
create index change_orders_decided_by_idx on public.change_orders(decided_by);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  posted_at timestamptz not null default now(),
  title text not null,
  detail text
);
create index project_updates_project_idx on public.project_updates(project_id, posted_at desc);

-- ── Private settings (not exposed through the API) ────────────────────────────────────
create schema if not exists portal_private;
revoke all on schema portal_private from public, anon, authenticated;
create table portal_private.settings (
  key text primary key,
  value text not null
);

-- ── Row-level security ────────────────────────────────────────────────────────────────
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.change_orders enable row level security;
alter table public.project_updates enable row level security;

create function public.is_client_member(p_client uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.client_members m
    where m.client_id = p_client and m.user_id = (select auth.uid())
  );
$$;

create function public.can_see_project(p_project text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    join public.client_members m on m.client_id = p.client_id
    where p.id = p_project and p.published_at is not null and m.user_id = (select auth.uid())
  );
$$;

create policy "members read their client" on public.clients
  for select to authenticated using (public.is_client_member(id));
create policy "members read their own membership" on public.client_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "members read published projects" on public.projects
  for select to authenticated using (published_at is not null and public.is_client_member(client_id));
create policy "members read milestones" on public.milestones
  for select to authenticated using (public.can_see_project(project_id));
create policy "members read change orders" on public.change_orders
  for select to authenticated using (public.can_see_project(project_id));
create policy "members read updates" on public.project_updates
  for select to authenticated using (public.can_see_project(project_id));

-- ── Client actions ────────────────────────────────────────────────────────────────────
create function public.decide_change_order(p_id uuid, p_decision text, p_note text default null)
returns public.change_orders language plpgsql security definer set search_path = '' as $$
declare
  v_order public.change_orders;
  v_uid uuid := (select auth.uid());
  v_label text;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'bad decision' using errcode = '22023'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'note too long' using errcode = '22023'; end if;

  select * into v_order from public.change_orders where id = p_id for update;
  if not found then raise exception 'not found' using errcode = 'P0002'; end if;

  if not exists (
    select 1 from public.projects p
    join public.client_members m on m.client_id = p.client_id
    where p.id = v_order.project_id and p.published_at is not null
      and m.user_id = v_uid and m.role = 'approver'
  ) then
    raise exception 'not an approver for this project' using errcode = '42501';
  end if;
  if v_order.status <> 'pending' then raise exception 'already decided' using errcode = '55000'; end if;

  select coalesce(u.email, case when u.is_anonymous then 'Demonstration client' end, 'Client')
    into v_label from auth.users u where u.id = v_uid;

  update public.change_orders
     set status = p_decision, decided_by = v_uid, decided_by_label = v_label,
         decided_at = now(), decision_note = nullif(trim(p_note), '')
   where id = p_id
  returning * into v_order;
  return v_order;
end;
$$;

-- The demonstration: any signed-in (including anonymous) user may join demo clients as an
-- approver. It never grants access to a client that is not flagged is_demo.
create function public.join_demo()
returns setof public.clients language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into public.client_members (client_id, user_id, role)
    select c.id, v_uid, 'approver' from public.clients c where c.is_demo
  on conflict (client_id, user_id) do nothing;
  return query select * from public.clients c where c.is_demo;
end;
$$;

-- ── PM actions (Command Center server only) ───────────────────────────────────────────
create function portal_private.check_pm_token(p_token text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_hash text;
begin
  select value into v_hash from portal_private.settings where key = 'pm_token_sha256';
  if v_hash is null or p_token is null
     or encode(extensions.digest(p_token, 'sha256'), 'hex') <> v_hash then
    raise exception 'unauthorised' using errcode = '42501';
  end if;
end;
$$;

-- Whether a project may be written by the unauthenticated showcase (demo clients only).
create function public.pm_project_scope(p_token text, p_project text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  perform portal_private.check_pm_token(p_token);
  select jsonb_build_object('exists', true, 'is_demo', c.is_demo, 'client', c.name)
    into v from public.projects p join public.clients c on c.id = p.client_id where p.id = p_project;
  return coalesce(v, jsonb_build_object('exists', false));
end;
$$;

-- Publishes the client-visible snapshot of one job order: project fields and milestones,
-- replaced as a set. Change orders are never touched here, so a republish cannot undo a
-- client's decision.
create function public.pm_publish_project(p_token text, p_project jsonb, p_milestones jsonb, p_published_by text)
returns public.projects language plpgsql security definer set search_path = '' as $$
declare v_row public.projects; v_id text := p_project->>'id';
begin
  perform portal_private.check_pm_token(p_token);
  if v_id is null then raise exception 'missing id' using errcode = '22023'; end if;
  if not exists (select 1 from public.projects where id = v_id) then
    raise exception 'project is not linked to a client' using errcode = 'P0002';
  end if;

  update public.projects set
    name = coalesce(p_project->>'name', name),
    location = p_project->>'location',
    discipline = p_project->>'discipline',
    currency = coalesce(p_project->>'currency', currency),
    original_contract_value = coalesce((p_project->>'original_contract_value')::numeric, original_contract_value),
    invoiced_to_date = coalesce((p_project->>'invoiced_to_date')::numeric, invoiced_to_date),
    progress = coalesce((p_project->>'progress')::int, progress),
    status_label = coalesce(p_project->>'status_label', status_label),
    headline = p_project->>'headline',
    start_date = (p_project->>'start_date')::date,
    target_end_date = (p_project->>'target_end_date')::date,
    published_at = now(),
    published_by = left(p_published_by, 200),
    updated_at = now()
  where id = v_id
  returning * into v_row;

  delete from public.milestones where project_id = v_id;
  insert into public.milestones (project_id, id, code, title, detail, target_date, status, sort)
  select v_id, m->>'id', m->>'code', m->>'title', m->>'detail', (m->>'target_date')::date, m->>'status', (ord - 1)::int
  from jsonb_array_elements(coalesce(p_milestones, '[]'::jsonb)) with ordinality as t(m, ord);

  return v_row;
end;
$$;

create function public.pm_raise_change_order(p_token text, p_project text, p_title text, p_reason text, p_amount numeric, p_raised_by text)
returns public.change_orders language plpgsql security definer set search_path = '' as $$
declare v_row public.change_orders; v_next int;
begin
  perform portal_private.check_pm_token(p_token);
  -- Serialise numbering per project.
  perform 1 from public.projects where id = p_project for update;
  if not found then raise exception 'project is not linked to a client' using errcode = 'P0002'; end if;
  select coalesce(max(number), 0) + 1 into v_next from public.change_orders where project_id = p_project;
  insert into public.change_orders (project_id, number, title, reason, amount, raised_by)
  values (p_project, v_next, trim(p_title), trim(p_reason), p_amount, left(p_raised_by, 200))
  returning * into v_row;
  return v_row;
end;
$$;

create function public.pm_withdraw_change_order(p_token text, p_id uuid)
returns public.change_orders language plpgsql security definer set search_path = '' as $$
declare v_row public.change_orders;
begin
  perform portal_private.check_pm_token(p_token);
  update public.change_orders set status = 'withdrawn', decided_at = now(), decided_by_label = 'Withdrawn by PMEC'
   where id = p_id and status = 'pending'
  returning * into v_row;
  if v_row.id is null then raise exception 'not pending' using errcode = '55000'; end if;
  return v_row;
end;
$$;

create function public.pm_post_update(p_token text, p_project text, p_title text, p_detail text)
returns public.project_updates language plpgsql security definer set search_path = '' as $$
declare v_row public.project_updates;
begin
  perform portal_private.check_pm_token(p_token);
  insert into public.project_updates (project_id, title, detail)
  values (p_project, trim(p_title), nullif(trim(p_detail), ''))
  returning * into v_row;
  return v_row;
end;
$$;

-- What the PM sees back: the published state and every change order with its decision.
create function public.pm_project_state(p_token text, p_project text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform portal_private.check_pm_token(p_token);
  return jsonb_build_object(
    'project', (select to_jsonb(p) from public.projects p where p.id = p_project),
    'client', (select to_jsonb(c) from public.clients c join public.projects p on p.client_id = c.id where p.id = p_project),
    'change_orders', coalesce((select jsonb_agg(to_jsonb(o) order by o.number) from public.change_orders o where o.project_id = p_project), '[]'::jsonb),
    'updates', coalesce((select jsonb_agg(to_jsonb(u) order by u.posted_at desc) from public.project_updates u where u.project_id = p_project), '[]'::jsonb)
  );
end;
$$;

-- ── Grants ────────────────────────────────────────────────────────────────────────────
revoke all on function public.is_client_member(uuid), public.can_see_project(text) from public, anon;
grant execute on function public.is_client_member(uuid), public.can_see_project(text) to authenticated;

revoke all on function public.decide_change_order(uuid, text, text), public.join_demo() from public, anon;
grant execute on function public.decide_change_order(uuid, text, text), public.join_demo() to authenticated;

revoke all on function portal_private.check_pm_token(text) from public, anon, authenticated;
revoke all on function
  public.pm_project_scope(text, text),
  public.pm_publish_project(text, jsonb, jsonb, text),
  public.pm_raise_change_order(text, text, text, text, numeric, text),
  public.pm_withdraw_change_order(text, uuid),
  public.pm_post_update(text, text, text, text),
  public.pm_project_state(text, text)
from public;
-- The Command Center calls these with the publishable key; the token is the real gate.
grant execute on function
  public.pm_project_scope(text, text),
  public.pm_publish_project(text, jsonb, jsonb, text),
  public.pm_raise_change_order(text, text, text, text, numeric, text),
  public.pm_withdraw_change_order(text, uuid),
  public.pm_post_update(text, text, text, text),
  public.pm_project_state(text, text)
to anon, authenticated;

-- ── Live updates to the portal ────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.projects, public.milestones, public.change_orders, public.project_updates;
