do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hackathon_gallery_products_team_id_key'
  ) then
    alter table hackathon_gallery_products
      add constraint hackathon_gallery_products_team_id_key unique (team_id);
  end if;
end $$;
