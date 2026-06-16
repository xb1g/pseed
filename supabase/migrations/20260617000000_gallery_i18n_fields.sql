alter table hackathon_gallery_products
  add column if not exists product_name_th text,
  add column if not exists problem_statement_th text,
  add column if not exists solution_description_th text;
