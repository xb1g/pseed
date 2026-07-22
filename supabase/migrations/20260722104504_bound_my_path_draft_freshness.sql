-- Keep full-draft sync from trusting a browser clock for possibility freshness.
-- The existing implementation becomes an inaccessible core; every callable
-- path passes through the receipt-time bounding wrapper below.

alter function private.sync_my_path_journey(jsonb, jsonb, jsonb)
  rename to sync_my_path_journey_unbounded;

revoke all on function private.sync_my_path_journey_unbounded(jsonb, jsonb, jsonb)
  from public, anon, authenticated;

create or replace function private.sync_my_path_journey(
  p_draft jsonb,
  p_direction jsonb,
  p_next_step jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bounded_draft jsonb := p_draft;
  v_bounded_possibilities jsonb;
  v_slug text;
  v_possibility jsonb;
  v_effective_updated_at timestamptz;
begin
  if jsonb_typeof(p_draft) = 'object'
     and jsonb_typeof(p_draft->'possibilities') = 'object' then
    v_bounded_possibilities := p_draft->'possibilities';

    for v_slug, v_possibility in
      select key, value
      from jsonb_each(v_bounded_possibilities)
    loop
      if jsonb_typeof(v_possibility) = 'object'
         and nullif(v_possibility->>'updatedAt', '') is not null then
        v_effective_updated_at := least(
          (v_possibility->>'updatedAt')::timestamptz,
          statement_timestamp()
        );
        v_bounded_possibilities := jsonb_set(
          v_bounded_possibilities,
          array[v_slug, 'updatedAt'],
          to_jsonb(v_effective_updated_at),
          false
        );
      end if;
    end loop;

    v_bounded_draft := jsonb_set(
      p_draft,
      '{possibilities}',
      v_bounded_possibilities,
      false
    );
  end if;

  return private.sync_my_path_journey_unbounded(
    v_bounded_draft,
    p_direction,
    p_next_step
  );
end;
$$;

revoke all on function private.sync_my_path_journey(jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function private.sync_my_path_journey(jsonb, jsonb, jsonb)
  to authenticated;
