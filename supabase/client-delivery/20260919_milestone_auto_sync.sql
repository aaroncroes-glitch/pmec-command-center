-- Milestones follow the job order automatically once a project has been published: this
-- replaces only the milestone set, never the published figures, and refuses a project the
-- PM has not published yet (so ticking a milestone can never publish a project by itself).
create function public.pm_sync_milestones(p_token text, p_project text, p_milestones jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if not exists (select 1 from public.projects where id = p_project) then
    raise exception 'project is not linked to a client' using errcode = 'P0002';
  end if;
  perform portal_private.check_pm_access(p_token, p_project);
  if not exists (select 1 from public.projects where id = p_project and published_at is not null) then
    raise exception 'publish the project first' using errcode = '55000';
  end if;

  delete from public.milestones where project_id = p_project;
  insert into public.milestones (project_id, id, code, title, detail, target_date, status, sort)
  select p_project, m->>'id', m->>'code', m->>'title', m->>'detail', (m->>'target_date')::date, m->>'status', (ord - 1)::int
  from jsonb_array_elements(coalesce(p_milestones, '[]'::jsonb)) with ordinality as t(m, ord);
  get diagnostics v_count = row_count;

  update public.projects set updated_at = now() where id = p_project;
  return v_count;
end;
$$;
revoke all on function public.pm_sync_milestones(text, text, jsonb) from public;
grant execute on function public.pm_sync_milestones(text, text, jsonb) to anon, authenticated;

-- pm_project_state also returns 'milestones' (what the client currently sees), so the PM
-- panel can tell when the job order has moved on.
create or replace function public.pm_project_state(p_token text, p_project text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform portal_private.check_pm_access(p_token, p_project);
  return jsonb_build_object(
    'project', (select to_jsonb(p) from public.projects p where p.id = p_project),
    'client', (select to_jsonb(c) from public.clients c join public.projects p on p.client_id = c.id where p.id = p_project),
    'milestones', coalesce((select jsonb_agg(to_jsonb(m) order by m.sort) from public.milestones m where m.project_id = p_project), '[]'::jsonb),
    'change_orders', coalesce((select jsonb_agg(to_jsonb(o) order by o.number) from public.change_orders o where o.project_id = p_project), '[]'::jsonb),
    'updates', coalesce((select jsonb_agg(to_jsonb(u) order by u.posted_at desc) from public.project_updates u where u.project_id = p_project), '[]'::jsonb)
  );
end;
$$;

-- Follow-up (applied as milestone_sync_refuses_empty): pm_sync_milestones also raises
-- 'no milestones' (22023) when p_milestones is null, not an array, or empty, before
-- deleting anything. A malformed request once emptied the demo programme; it cannot now.
