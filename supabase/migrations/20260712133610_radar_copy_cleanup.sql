UPDATE public.radar_cards
SET content_th = replace(
  replace(
    replace(content_th::text, 'เรียนคณะไหนทำงานนี้ได้?', 'มีเส้นทางไหนเข้าสู่อาชีพนี้ได้บ้าง?'),
    'AI ช่วยเธอ',
    'AI ช่วยคุณทำอะไรได้บ้าง'
  ),
  'อาชีพนี้รอดไหม?',
  'แนวโน้มอาชีพนี้เป็นอย่างไร?'
)::jsonb
WHERE content_th::text ~ 'เธอ|เรียนคณะไหนทำงานนี้ได้|อาชีพนี้รอดไหม';
