create or replace function private.get_my_path_report_evidence()
returns table (
  id uuid,
  enrollment_id uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  return query
  select r.id, r.enrollment_id, r.created_at
  from public.path_reports r
  join public.path_enrollments pe on pe.id = r.enrollment_id
  where pe.user_id = v_user_id
  order by r.created_at desc, r.id;
end;
$$;

create or replace function public.get_my_path_report_evidence()
returns table (
  id uuid,
  enrollment_id uuid,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_my_path_report_evidence();
$$;

revoke all on function private.get_my_path_report_evidence()
  from public, anon, authenticated;
revoke all on function public.get_my_path_report_evidence()
  from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.get_my_path_report_evidence()
  to authenticated;
grant execute on function public.get_my_path_report_evidence()
  to authenticated;
