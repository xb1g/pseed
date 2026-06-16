alter table hackathon_gallery_products
  add column if not exists test_mode text not null default 'contact'
    check (test_mode in ('direct', 'contact')),
  add column if not exists contact_email text;
