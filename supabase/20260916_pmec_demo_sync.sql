-- PMEC Command Center showcase demo sync — Supabase.
-- APPLIED 16 Sep 2026 to project kljlsyrqcnptvyvgnxcl ("ADMANCO Command Center") at Aaron's
-- request, as migration "pmec_demo_sync". Walled off from that project's own tables: a private
-- schema PostgREST does not expose, RLS on with no policies, and three SECURITY DEFINER
-- functions as the only way in. Demo data only. The checks repeat the API's limits.
create schema if not exists pmec_demo;
revoke all on schema pmec_demo from public, anon, authenticated;

create table if not exists pmec_demo.demo_state (
  room text not null check (room ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  key text not null check (key in ('lumen.pmec.control-center.v2', 'lumen.pmec.job-orders.v2')),
  value jsonb not null check (octet_length(value::text) <= 1000000),
  version integer not null check (version >= 1),
  updated_at timestamptz not null default now(),
  primary key (room, key)
);
alter table pmec_demo.demo_state enable row level security;
revoke all on pmec_demo.demo_state from public, anon, authenticated;

create or replace function public.pmec_demo_versions(p_room text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'lumen.pmec.control-center.v2', coalesce((select version from pmec_demo.demo_state where room = p_room and key = 'lumen.pmec.control-center.v2'), 0),
    'lumen.pmec.job-orders.v2',     coalesce((select version from pmec_demo.demo_state where room = p_room and key = 'lumen.pmec.job-orders.v2'), 0));
$$;

create or replace function public.pmec_demo_read(p_room text, p_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object('value', value, 'version', version) from pmec_demo.demo_state where room = p_room and key = p_key),
    jsonb_build_object('value', null, 'version', 0));
$$;

create or replace function public.pmec_demo_write(p_room text, p_key text, p_value jsonb, p_base integer, p_force boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v integer;
begin
  insert into pmec_demo.demo_state as s (room, key, value, version, updated_at)
  values (p_room, p_key, p_value, 1, now())
  on conflict (room, key) do update
    set value = excluded.value, version = s.version + 1, updated_at = now()
    where p_force or s.version = p_base
  returning s.version into v;
  if v is null then
    return jsonb_build_object('ok', false) || public.pmec_demo_read(p_room, p_key);
  end if;
  return jsonb_build_object('ok', true, 'version', v);
end;
$$;

revoke all on function public.pmec_demo_versions(text) from public;
revoke all on function public.pmec_demo_read(text, text) from public;
revoke all on function public.pmec_demo_write(text, text, jsonb, integer, boolean) from public;
grant execute on function public.pmec_demo_versions(text) to anon, authenticated;
grant execute on function public.pmec_demo_read(text, text) to anon, authenticated;
grant execute on function public.pmec_demo_write(text, text, jsonb, integer, boolean) to anon, authenticated;
