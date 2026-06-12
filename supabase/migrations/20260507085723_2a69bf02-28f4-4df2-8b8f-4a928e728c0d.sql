
create table if not exists public.conference_menu_cards (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  meal_type meal_type,
  image_url text not null,
  storage_path text,
  source text not null default 'upload',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.conference_menu_cards enable row level security;

create policy "public read menu cards" on public.conference_menu_cards
  for select using (true);
create policy "admins manage menu cards" on public.conference_menu_cards
  for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

create index if not exists idx_menu_cards_date on public.conference_menu_cards(service_date);

insert into storage.buckets (id, name, public)
values ('menu-cards', 'menu-cards', true)
on conflict (id) do nothing;

create policy "menu cards public read" on storage.objects
  for select using (bucket_id = 'menu-cards');
create policy "menu cards admin write" on storage.objects
  for insert with check (bucket_id = 'menu-cards' and has_role(auth.uid(), 'admin'));
create policy "menu cards admin update" on storage.objects
  for update using (bucket_id = 'menu-cards' and has_role(auth.uid(), 'admin'));
create policy "menu cards admin delete" on storage.objects
  for delete using (bucket_id = 'menu-cards' and has_role(auth.uid(), 'admin'));
