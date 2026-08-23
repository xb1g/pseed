-- Retry a completed AI Chat assessment as one atomic operation.
CREATE OR REPLACE FUNCTION public.reset_completed_ai_chat_attempt(
  p_session_id uuid,
  p_assessment_id uuid,
  p_progress_id uuid,
  p_user_id uuid,
  p_node_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM 1
  FROM public.node_ai_chat_sessions AS s
  JOIN public.node_assessments AS assessment
    ON assessment.id = s.assessment_id
  WHERE s.id = p_session_id
    AND s.assessment_id = p_assessment_id
    AND s.progress_id = p_progress_id
    AND s.user_id = p_user_id
    AND s.is_completed = true
    AND assessment.node_id = p_node_id
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  DELETE FROM public.assessment_submissions
  WHERE progress_id = p_progress_id
    AND assessment_id = p_assessment_id
    AND metadata @> jsonb_build_object('ai_chat_session_id', p_session_id);

  UPDATE public.student_node_progress
  SET status = 'in_progress',
      submitted_at = NULL
  WHERE id = p_progress_id
    AND user_id = p_user_id
    AND node_id = p_node_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI Chat progress record not found';
  END IF;

  DELETE FROM public.node_ai_chat_sessions
  WHERE id = p_session_id
    AND assessment_id = p_assessment_id
    AND progress_id = p_progress_id
    AND user_id = p_user_id
    AND is_completed = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI Chat session changed during retry';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_completed_ai_chat_attempt(uuid, uuid, uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_completed_ai_chat_attempt(uuid, uuid, uuid, uuid, uuid)
TO service_role;

COMMENT ON FUNCTION public.reset_completed_ai_chat_attempt(uuid, uuid, uuid, uuid, uuid) IS
  'Atomically removes one owned completed AI Chat result and transcript, then returns its node progress to in_progress.';

NOTIFY pgrst, 'reload schema';
