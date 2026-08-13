-- Instagram comment lead capture. Comments belong to our own media, so
-- (unlike DMs) the Graph API can backfill full history, not just new events.

CREATE TABLE IF NOT EXISTS public.ig_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ig_comment_id text NOT NULL UNIQUE,
    media_id text NOT NULL,
    parent_comment_id text,
    username text,
    ig_user_id text,
    text text NOT NULL,
    grade_level text,
    stage text NOT NULL DEFAULT 'unknown' CHECK (
      stage IN ('unknown', 'exploring', 'building', 'job_seeking')
    ),
    recommended_product text,
    classified_at timestamptz,
    replied_at timestamptz,
    commented_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ig_comments_select_admin" ON public.ig_comments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE POLICY "ig_comments_modify_admin" ON public.ig_comments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE INDEX IF NOT EXISTS idx_ig_comments_stage ON public.ig_comments(stage);
CREATE INDEX IF NOT EXISTS idx_ig_comments_media ON public.ig_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_ig_comments_commented_at ON public.ig_comments(commented_at DESC);

CREATE TRIGGER update_ig_comments_updated_at
    BEFORE UPDATE ON public.ig_comments
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
