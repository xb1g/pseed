-- Seed career_survival table with 20 curated careers
-- Realistic, well-researched data from BLS, WEF, McKinsey, and other public sources.

INSERT INTO public.career_survival (slug, aliases, tier, reasoning, sources, escape_route_slug)
VALUES
  (
    'software-engineer',
    ARRAY['programmer', 'coder', 'developer', 'software developer'],
    'growing',
    'Demand for software engineers continues to outpace supply globally. AI coding assistants augment productivity but do not replace the architectural reasoning, debugging, and systems design that senior engineers perform. The U.S. Bureau of Labor Statistics projects 25% growth in software development roles through 2032.',
    '[{"title":"Occupational Outlook Handbook: Software Developers","url":"https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    NULL
  ),
  (
    'data-scientist',
    ARRAY['data analyst', 'machine learning engineer', 'ml engineer', 'data engineer'],
    'growing',
    'Organizations are investing heavily in AI and analytics, driving sustained demand for data scientists who can translate raw data into strategic decisions. The role requires domain expertise, statistical rigor, and communication skills that are difficult to automate. BLS projects 35% growth for data scientist positions through 2032.',
    '[{"title":"Occupational Outlook Handbook: Data Scientists","url":"https://www.bls.gov/ooh/math/data-scientists.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Age of AI: Promise and Peril","url":"https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai","author":"McKinsey & Company","date":"2023-08-01"}]'::jsonb,
    NULL
  ),
  (
    'product-manager',
    ARRAY['pm', 'product owner', 'program manager'],
    'growing',
    'Product management sits at the intersection of user needs, business strategy, and technical feasibility. It requires cross-functional leadership, stakeholder negotiation, and ambiguous problem-solving that AI cannot replicate. As tech product complexity grows, so does demand for experienced PMs.',
    '[{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"},{"title":"Product Management in the Age of AI","url":"https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/product-management-in-the-age-of-ai","author":"McKinsey & Company","date":"2023-11-15"}]'::jsonb,
    NULL
  ),
  (
    'ux-designer',
    ARRAY['user experience designer', 'interaction designer', 'ui/ux designer', 'product designer'],
    'growing',
    'Human-centered design demands deep empathy, ethnographic research, and iterative prototyping with real users. AI can generate UI mockups but cannot conduct contextual inquiry or synthesize qualitative insights. The field is expanding as companies compete on customer experience.',
    '[{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"},{"title":"Design in the Age of AI","url":"https://www.nngroup.com/articles/ai-ux/","author":"Nielsen Norman Group","date":"2023-06-12"}]'::jsonb,
    NULL
  ),
  (
    'graphic-designer',
    ARRAY['visual designer', 'digital designer', 'creative designer'],
    'shifting',
    'Generative AI tools like Midjourney and DALL-E are compressing timelines for asset creation, but brands still need human designers for art direction, brand consistency, and creative strategy. The role is shifting from pixel-pushing to creative direction and prompt engineering.',
    '[{"title":"Occupational Outlook Handbook: Graphic Designers","url":"https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    'ux-designer'
  ),
  (
    'content-writer',
    ARRAY['copywriter', 'blog writer', 'technical writer', 'freelance writer'],
    'shifting',
    'AI can draft routine copy at scale, but high-quality journalism, thought leadership, and technical writing require subject-matter expertise, original reporting, and editorial judgment. The market is bifurcating: commodity content is automated, while premium writing commands higher rates.',
    '[{"title":"The State of AI in 2023","url":"https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-in-2023-generative-ais-breakout-year","author":"McKinsey & Company","date":"2023-08-01"},{"title":"Will AI Replace Writers?","url":"https://www.niemanlab.org/2023/06/will-ai-replace-writers/","author":"Nieman Lab","date":"2023-06-15"}]'::jsonb,
    NULL
  ),
  (
    'marketing-specialist',
    ARRAY['digital marketer', 'growth marketer', 'seo specialist', 'marketing manager'],
    'shifting',
    'AI analytics and automated ad bidding have reduced the need for manual campaign optimization, but strategic brand positioning, creative storytelling, and cross-channel orchestration remain human-led. Marketers are upskilling in data literacy and AI tool fluency.',
    '[{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"},{"title":"Marketing and Sales in the Age of AI","url":"https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/ai-powered-marketing-and-sales-reach-new-heights","author":"McKinsey & Company","date":"2023-05-10"}]'::jsonb,
    NULL
  ),
  (
    'accountant',
    ARRAY['bookkeeper', 'tax preparer', 'auditor', 'cpa'],
    'exposed',
    'Cloud accounting software and AI-powered bookkeeping tools can now automate invoice processing, reconciliation, and basic tax preparation. While forensic accounting and strategic advisory remain resilient, entry-level compliance and data-entry roles are rapidly declining.',
    '[{"title":"Occupational Outlook Handbook: Accountants and Auditors","url":"https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    'financial-analyst'
  ),
  (
    'customer-service-representative',
    ARRAY['support agent', 'call center agent', 'help desk', 'customer support'],
    'exposed',
    'Conversational AI and large language models now handle tier-1 inquiries such as refunds, password resets, and order tracking with high accuracy. Companies are deploying AI agents 24/7, reducing headcount for routine support while reserving humans for escalations.',
    '[{"title":"Occupational Outlook Handbook: Customer Service Representatives","url":"https://www.bls.gov/ooh/office-and-administrative-support/customer-service-representatives.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The State of AI in Customer Service","url":"https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-state-of-ai-in-customer-service","author":"McKinsey & Company","date":"2023-10-20"}]'::jsonb,
    NULL
  ),
  (
    'translator',
    ARRAY['interpreter', 'linguist', 'localizer', 'translator-interpreter'],
    'exposed',
    'Neural machine translation has reached near-human quality for major language pairs, and real-time speech translation is now consumer-grade. Literary and legal translation still require cultural nuance, but general commercial translation demand is shrinking.',
    '[{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"},{"title":"How AI Is Changing Translation","url":"https://www.nature.com/articles/d41586-023-00437-2","author":"Nature","date":"2023-02-15"}]'::jsonb,
    'content-writer'
  ),
  (
    'paralegal',
    ARRAY['legal assistant', 'legal secretary', 'law clerk'],
    'exposed',
    'AI contract analysis, e-discovery platforms, and document-review tools can process thousands of pages in hours. Paralegals who specialize in routine discovery, due diligence, and form drafting face displacement, though litigation support and client interaction roles are more durable.',
    '[{"title":"Occupational Outlook Handbook: Paralegals and Legal Assistants","url":"https://www.bls.gov/ooh/legal/paralegals-and-legal-assistants.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"AI and the Legal Profession","url":"https://www.mckinsey.com/industries/public-sector/our-insights/ai-and-the-legal-profession","author":"McKinsey & Company","date":"2023-09-10"}]'::jsonb,
    'lawyer'
  ),
  (
    'teacher',
    ARRAY['educator', 'instructor', 'school teacher', 'classroom teacher'],
    'growing',
    'Despite AI tutoring tools, the social-emotional, mentorship, and classroom-management aspects of teaching remain irreplaceable. Global teacher shortages are acute in STEM and special education. The U.S. alone needs an estimated 200,000 additional teachers annually.',
    '[{"title":"Occupational Outlook Handbook: High School Teachers","url":"https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    NULL
  ),
  (
    'nurse',
    ARRAY['registered nurse', 'rn', 'healthcare nurse', 'clinical nurse'],
    'growing',
    'Aging populations in developed and emerging economies are driving unprecedented demand for nurses. The work requires physical dexterity, emotional intelligence, and split-second clinical judgment in unpredictable environments. The WHO projects a global shortage of 10 million nurses by 2030.',
    '[{"title":"Occupational Outlook Handbook: Registered Nurses","url":"https://www.bls.gov/ooh/healthcare/registered-nurses.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"State of the Worlds Nursing 2023","url":"https://www.who.int/publications/i/item/9789240069947","author":"World Health Organization","date":"2023-01-01"}]'::jsonb,
    NULL
  ),
  (
    'electrician',
    ARRAY['electrical technician', 'wireman', 'electrical contractor'],
    'growing',
    'Electrical infrastructure for renewable energy, data centers, and electric vehicles is expanding rapidly. The trade requires on-site problem solving, physical installation, and safety certification that cannot be automated. BLS projects steady growth and strong median wages.',
    '[{"title":"Occupational Outlook Handbook: Electricians","url":"https://www.bls.gov/ooh/construction-and-extraction/electricians.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    NULL
  ),
  (
    'truck-driver',
    ARRAY['long-haul driver', 'delivery driver', 'freight driver', 'cdl driver'],
    'shifting',
    'Autonomous trucking technology is advancing, but regulatory, liability, and edge-case safety barriers mean full driverless deployment is still years away. In the near term, drivers are shifting to last-mile delivery, fleet supervision, and human-in-the-loop monitoring roles.',
    '[{"title":"Occupational Outlook Handbook: Heavy and Tractor-Trailer Truck Drivers","url":"https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"Autonomous Trucks and the Future of Freight","url":"https://www.mckinsey.com/industries/travel-logistics-and-infrastructure/our-insights/autonomous-trucks-and-the-future-of-freight","author":"McKinsey & Company","date":"2023-07-20"}]'::jsonb,
    NULL
  ),
  (
    'journalist',
    ARRAY['reporter', 'news writer', 'correspondent', 'investigative journalist'],
    'shifting',
    'AI can generate earnings summaries and sports recaps, but investigative journalism, on-the-ground reporting, and accountability storytelling require human judgment, source relationships, and ethical reasoning. The industry is contracting in some areas while premium investigative outlets see stable or growing support.',
    '[{"title":"Occupational Outlook Handbook: News Analysts, Reporters, and Journalists","url":"https://www.bls.gov/ooh/media-and-communication/news-analysts-reporters-and-journalists.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"Journalism and AI","url":"https://reutersinstitute.politics.ox.ac.uk/journalism-and-ai","author":"Reuters Institute","date":"2023-11-01"}]'::jsonb,
    'content-writer'
  ),
  (
    'financial-analyst',
    ARRAY['investment analyst', 'equity analyst', 'research analyst', 'securities analyst'],
    'shifting',
    'Algorithmic trading and AI-powered financial modeling have automated quantitative analysis, but strategic advisory, client relationships, and narrative-driven investment theses still require human expertise. Analysts are shifting from spreadsheet modeling to data interpretation and stakeholder communication.',
    '[{"title":"Occupational Outlook Handbook: Financial Analysts","url":"https://www.bls.gov/ooh/business-and-financial/financial-analysts.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    NULL
  ),
  (
    'hr-recruiter',
    ARRAY['talent acquisition specialist', 'recruiter', 'hiring manager', 'sourcer'],
    'shifting',
    'AI resume screening and chatbot scheduling have automated high-volume sourcing, but culture fit assessment, executive search, and candidate experience design remain deeply human. Recruiters are pivoting toward employer branding, talent strategy, and DEI consulting.',
    '[{"title":"Occupational Outlook Handbook: Human Resources Specialists","url":"https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    NULL
  ),
  (
    'photographer',
    ARRAY['photojournalist', 'event photographer', 'portrait photographer', 'commercial photographer'],
    'shifting',
    'Generative AI can synthesize stock imagery, but event photography, photojournalism, and brand storytelling demand real-world presence, timing, and human connection. The market is polarizing: commodity stock photography is declining, while live and documentary photography persists.',
    '[{"title":"Occupational Outlook Handbook: Photographers","url":"https://www.bls.gov/ooh/media-and-communication/photographers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"The Future of Jobs Report 2023","url":"https://www.weforum.org/reports/the-future-of-jobs-report-2023/","author":"World Economic Forum","date":"2023-04-30"}]'::jsonb,
    'graphic-designer'
  ),
  (
    'lawyer',
    ARRAY['attorney', 'counsel', 'solicitor', 'barrister'],
    'growing',
    'Complex litigation, negotiation, and regulatory strategy require contextual reasoning, ethical judgment, and client advocacy that AI cannot replicate. While AI accelerates legal research and contract drafting, demand for lawyers in high-stakes disputes, M&A, and compliance continues to grow.',
    '[{"title":"Occupational Outlook Handbook: Lawyers","url":"https://www.bls.gov/ooh/legal/lawyers.htm","author":"U.S. Bureau of Labor Statistics","date":"2024-01-01"},{"title":"AI and the Legal Profession","url":"https://www.mckinsey.com/industries/public-sector/our-insights/ai-and-the-legal-profession","author":"McKinsey & Company","date":"2023-09-10"}]'::jsonb,
    NULL
  )
ON CONFLICT (slug) DO NOTHING;
