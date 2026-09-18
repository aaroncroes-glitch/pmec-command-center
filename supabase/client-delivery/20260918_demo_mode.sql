-- Demo mode (applied after 20260918_client_delivery.sql): no sign-in anywhere.
-- Demonstration clients (clients.is_demo) are readable and decidable by anyone, and the PM
-- functions accept them without the server token. Non-demo clients keep the original rules.

create function public.is_demo_project(p_project text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p join public.clients c on c.id = p.client_id
    where p.id = p_project and c.is_demo and p.published_at is not null
  );
$$;
grant execute on function public.is_demo_project(text) to anon, authenticated;

create policy "anyone reads demo clients" on public.clients
  for select to anon, authenticated using (is_demo);
create policy "anyone reads published demo projects" on public.projects
  for select to anon, authenticated using (public.is_demo_project(id));
create policy "anyone reads demo milestones" on public.milestones
  for select to anon, authenticated using (public.is_demo_project(project_id));
create policy "anyone reads demo change orders" on public.change_orders
  for select to anon, authenticated using (public.is_demo_project(project_id));
create policy "anyone reads demo updates" on public.project_updates
  for select to anon, authenticated using (public.is_demo_project(project_id));

create function public.demo_decide_change_order(p_id uuid, p_decision text, p_note text default null)
returns public.change_orders language plpgsql security definer set search_path = '' as $$
declare v_order public.change_orders;
begin
  if p_decision not in ('approved', 'rejected') then raise exception 'bad decision' using errcode = '22023'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'note too long' using errcode = '22023'; end if;
  select * into v_order from public.change_orders where id = p_id for update;
  if not found then raise exception 'not found' using errcode = 'P0002'; end if;
  if not public.is_demo_project(v_order.project_id) then raise exception 'not a demonstration project' using errcode = '42501'; end if;
  if v_order.status <> 'pending' then raise exception 'already decided' using errcode = '55000'; end if;
  update public.change_orders
     set status = p_decision, decided_by = null, decided_by_label = 'Renaissance Aruba (demo client)',
         decided_at = now(), decision_note = nullif(trim(p_note), '')
   where id = p_id
  returning * into v_order;
  return v_order;
end;
$$;
revoke all on function public.demo_decide_change_order(uuid, text, text) from public;
grant execute on function public.demo_decide_change_order(uuid, text, text) to anon, authenticated;

create function portal_private.check_pm_access(p_token text, p_project text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.projects p join public.clients c on c.id = p.client_id where p.id = p_project and c.is_demo) then
    return;
  end if;
  perform portal_private.check_pm_token(p_token);
end;
$$;
revoke all on function portal_private.check_pm_access(text, text) from public, anon, authenticated;

-- pm_project_scope, pm_publish_project, pm_raise_change_order, pm_withdraw_change_order,
-- pm_post_update and pm_project_state were then replaced (create or replace) with the same
-- bodies as in 20260918_client_delivery.sql, except that each calls
-- portal_private.check_pm_access(p_token, <project>) instead of check_pm_token(p_token),
-- after confirming the project exists.
