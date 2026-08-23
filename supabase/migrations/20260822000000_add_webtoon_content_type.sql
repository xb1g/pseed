-- Add 'webtoon' to the allowed content types for node_content.
--
-- A webtoon is one long vertical image (manhwa/webtoon style) that the reader
-- scrolls through. The author uploads a single tall file; the editor slices it
-- client-side into ordered panels so each upload stays under the image API's
-- size cap and under the browser's image decode ceiling.
--
-- Storage shape (no new columns):
--   content_body -> {"panels":[{"url":"...","w":1080,"h":1920}, ...]}
--   content_url  -> first panel URL, so existing preview/thumbnail code that
--                   reads content_url still has something to show.

-- Drop the existing constraint
ALTER TABLE public.node_content
DROP CONSTRAINT IF EXISTS node_content_content_type_check;

-- Add the new constraint with 'webtoon' included
ALTER TABLE public.node_content
ADD CONSTRAINT node_content_content_type_check
CHECK (content_type = ANY (ARRAY[
  'video'::text,
  'canva_slide'::text,
  'text'::text,
  'image'::text,
  'pdf'::text,
  'resource_link'::text,
  'order_code'::text,
  'webtoon'::text
]));

COMMENT ON COLUMN public.node_content.content_type IS 'Type of content. webtoon stores an ordered panel list as JSON in content_body: {"panels":[{"url","w","h"}]}';
