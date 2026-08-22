-- Allow map-native assessments to run an AI-guided chat.
ALTER TABLE public.node_assessments
DROP CONSTRAINT IF EXISTS node_assessments_assessment_type_check;

ALTER TABLE public.node_assessments
ADD CONSTRAINT node_assessments_assessment_type_check
CHECK (
  assessment_type = ANY (
    ARRAY[
      'quiz'::text,
      'text_answer'::text,
      'image_upload'::text,
      'file_upload'::text,
      'checklist'::text,
      'ai_chat'::text
    ]
  )
);

COMMENT ON COLUMN public.node_assessments.metadata IS
  'Assessment configuration. ai_chat uses system_prompt, opening_message, objective, completion_criteria, model, and max_turns.';

CREATE TABLE public.node_ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.node_assessments(id) ON DELETE CASCADE,
  progress_id uuid NOT NULL REFERENCES public.student_node_progress(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective text NOT NULL DEFAULT '',
  completion_percentage integer NOT NULL DEFAULT 0
    CHECK (completion_percentage BETWEEN 0 AND 100),
  turn_count integer NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  is_completed boolean NOT NULL DEFAULT false,
  completion_reason text CHECK (completion_reason IN ('criteria_met', 'max_turns')),
  final_feedback text,
  completion_evidence text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (assessment_id, user_id)
);

CREATE TABLE public.node_ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.node_ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX node_ai_chat_sessions_user_idx
  ON public.node_ai_chat_sessions (user_id, updated_at DESC);
CREATE INDEX node_ai_chat_sessions_assessment_idx
  ON public.node_ai_chat_sessions (assessment_id, updated_at DESC);
CREATE INDEX node_ai_chat_messages_session_idx
  ON public.node_ai_chat_messages (session_id, created_at ASC);

ALTER TABLE public.node_ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_ai_chat_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.node_ai_chat_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.node_ai_chat_messages FROM anon, authenticated;
GRANT SELECT ON TABLE public.node_ai_chat_sessions TO authenticated;
GRANT SELECT ON TABLE public.node_ai_chat_messages TO authenticated;

CREATE POLICY "students_view_own_ai_chat_sessions"
ON public.node_ai_chat_sessions
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "map_staff_view_ai_chat_sessions"
ON public.node_ai_chat_sessions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.node_assessments na
    JOIN public.map_nodes mn ON mn.id = na.node_id
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE na.id = node_ai_chat_sessions.assessment_id
      AND (
        lm.creator_id = (SELECT auth.uid())
        OR public.is_admin((SELECT auth.uid()))
        OR EXISTS (
          SELECT 1
          FROM public.map_editors me
          WHERE me.map_id = lm.id
            AND me.user_id = (SELECT auth.uid())
        )
      )
  )
);

CREATE POLICY "students_view_own_ai_chat_messages"
ON public.node_ai_chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.node_ai_chat_sessions s
    WHERE s.id = node_ai_chat_messages.session_id
      AND s.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "map_staff_view_ai_chat_messages"
ON public.node_ai_chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.node_ai_chat_sessions s
    JOIN public.node_assessments na ON na.id = s.assessment_id
    JOIN public.map_nodes mn ON mn.id = na.node_id
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE s.id = node_ai_chat_messages.session_id
      AND (
        lm.creator_id = (SELECT auth.uid())
        OR public.is_admin((SELECT auth.uid()))
        OR EXISTS (
          SELECT 1
          FROM public.map_editors me
          WHERE me.map_id = lm.id
            AND me.user_id = (SELECT auth.uid())
        )
      )
  )
);

COMMENT ON TABLE public.node_ai_chat_sessions IS
  'Map-native AI chat assessment sessions. Writes are server-only; students and map staff receive read access through RLS.';
COMMENT ON TABLE public.node_ai_chat_messages IS
  'Ordered AI chat transcript messages. Writes are server-only; reads follow session ownership and map staff access.';
