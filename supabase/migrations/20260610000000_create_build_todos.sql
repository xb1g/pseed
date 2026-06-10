create table build_todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  is_done boolean not null default false,
  due_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table build_todos enable row level security;

create policy "Users can view own todos"
  on build_todos for select
  using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on build_todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on build_todos for update
  using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on build_todos for delete
  using (auth.uid() = user_id);
