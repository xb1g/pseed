-- Emit milestone-completed parent updates for rows created in their terminal
-- state as well as rows that transition there later. The existing queue
-- function retains the unique idempotency-key conflict guard.
create or replace function private.emit_parent_milestone_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_seed_title text;
  v_current_day integer;
begin
  if new.status <> 'completed' then
    return new;
  end if;

  -- OLD is unavailable for INSERT, so keep it inside an explicit TG_OP guard.
  if TG_OP = 'UPDATE' then
    if old.status is not distinct from 'completed' then
      return new;
    end if;
  end if;

  select s.id, seed.title, pe.current_day
  into v_subscription_id, v_seed_title, v_current_day
  from public.path_enrollments pe
  join public.paths p on p.id = pe.path_id
  join public.trial_accesses t
    on t.seed_id = p.seed_id and t.user_id = pe.user_id
  join public.parent_pathlab_subscriptions s on s.trial_access_id = t.id
  join public.seeds seed on seed.id = t.seed_id
  where pe.id = new.enrollment_id
    and s.verified_at is not null
    and s.unsubscribed_at is null
    and s.revoked_at is null
  limit 1;

  if v_subscription_id is not null then
    perform private.queue_parent_pathlab_update(
      v_subscription_id,
      'milestone_completed',
      'path_activity_progress',
      new.id,
      'completed',
      jsonb_build_object(
        'seedTitle', v_seed_title,
        'enrollmentId', new.enrollment_id,
        'currentDay', v_current_day,
        'activityId', new.activity_id
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists parent_milestone_completed_outbox
  on public.path_activity_progress;
create trigger parent_milestone_completed_outbox
  after insert or update of status on public.path_activity_progress
  for each row execute function private.emit_parent_milestone_completed();

revoke all on function private.emit_parent_milestone_completed() from public;
