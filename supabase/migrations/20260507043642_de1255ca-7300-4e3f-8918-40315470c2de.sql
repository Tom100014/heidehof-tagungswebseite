
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles for select
  using (auth.uid() = user_id);
create policy "users update own profile" on public.profiles for update
  using (auth.uid() = user_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "admins read roles" on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));
create policy "users read own role" on public.user_roles for select
  using (auth.uid() = user_id);

-- Auto profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public._touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Clara knowledge base
create table public.clara_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'general',
  content text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clara_knowledge enable row level security;

create policy "public read active knowledge"
  on public.clara_knowledge for select
  using (is_active = true);

create policy "admins manage knowledge"
  on public.clara_knowledge for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger trg_clara_knowledge_updated before update on public.clara_knowledge
for each row execute function public._touch_updated_at();

-- App settings
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

create policy "public read settings" on public.app_settings for select using (true);
create policy "admins manage settings" on public.app_settings for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger trg_app_settings_updated before update on public.app_settings
for each row execute function public._touch_updated_at();

-- Tagungs Inquiries
create table public.tagungs_inquiries (
  id uuid primary key default gen_random_uuid(),
  firma text, name text, email text, telefon text,
  anlass text, personen text, datum text, dauer text,
  uebernachtung text, verpflegung text, technik text,
  raumvorschlag text, pauschalvorschlag text,
  besonderheiten text, zusammenfassung text,
  conversation jsonb,
  email_sent boolean not null default false,
  email_error text,
  created_at timestamptz not null default now()
);
alter table public.tagungs_inquiries enable row level security;

create policy "anyone insert inquiry" on public.tagungs_inquiries for insert with check (true);
create policy "admins read inquiries" on public.tagungs_inquiries for select
  using (public.has_role(auth.uid(), 'admin'));

-- Site images (managed by admin)
create table public.site_images (
  slug text primary key,
  url text not null,
  alt text,
  storage_path text,
  updated_at timestamptz not null default now()
);
alter table public.site_images enable row level security;

create policy "public read site images" on public.site_images for select using (true);
create policy "admins manage site images" on public.site_images for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger trg_site_images_updated before update on public.site_images
for each row execute function public._touch_updated_at();

-- Storage bucket for site images
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "public read site-images storage"
  on storage.objects for select using (bucket_id = 'site-images');
create policy "admins write site-images storage"
  on storage.objects for insert
  with check (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));
create policy "admins update site-images storage"
  on storage.objects for update
  using (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));
create policy "admins delete site-images storage"
  on storage.objects for delete
  using (bucket_id = 'site-images' and public.has_role(auth.uid(), 'admin'));

-- Seed settings
insert into public.app_settings (key, value) values
  ('inquiry_recipient_email', '"reservierung@der-heidehof.de"'::jsonb),
  ('inquiry_from_email', '"Hotel Der Heidehof <onboarding@resend.dev>"'::jsonb)
on conflict (key) do nothing;

-- Seed Clara knowledge
insert into public.clara_knowledge (title, category, content, sort_order) values
('Heidehof-Saal', 'raum', 'Heidehof-Saal: bis 250 Personen, teilbar, Tageslicht, 4,2m Deckenhöhe. Ideal für Galas, Kongresse, Produktpräsentationen. Theater 250, Parlament 150, U-Form 60, Block 50, Bankett 180.', 10),
('Salon Schiller', 'raum', 'Salon Schiller: bis 80 Personen, Tageslicht, eigener Foyer-Bereich. Workshops & mittlere Tagungen. Theater 80, Parlament 50, U-Form 30, Block 28, Bankett 60.', 20),
('Salon Goethe', 'raum', 'Salon Goethe: bis 40 Personen. Klassischer Seminarraum mit Tageslicht. Theater 40, Parlament 24, U-Form 20, Block 18.', 30),
('Salon Lessing', 'raum', 'Salon Lessing: bis 25 Personen. Boardroom für Strategie- und Vorstandsmeetings.', 40),
('Salon Hölderlin', 'raum', 'Salon Hölderlin: bis 14 Personen. Für Kreativ-Workshops, Coachings und kleine Boards.', 50),
('Tagungspauschale Klassik 75€', 'pauschale', '75€/Person/Tag: Tagungsraum, 2 Kaffeepausen, 3-Gang Mittagessen, Tagungsgetränke, Standard-Technik.', 100),
('Premium All-Inclusive 199€', 'pauschale', '199€/Person/Tag: Tagungsraum, Vollverpflegung inkl. Abendessen, Tagungsgetränke ganztägig, Premium-Technik, Übernachtung im EZ inkl. Frühstück & SPA.', 110),
('Technik & Ausstattung', 'technik', 'Inklusive: Beamer, Leinwand, WLAN, Flipchart, Moderationskoffer. Auf Wunsch: Hybrid-Setup, Streaming, Übersetzungskabinen, LED-Wand, Bühne, Funkmikros.', 200),
('SPA & Wellness', 'spa', 'Innenpool, Saunalandschaft (Finnische, Bio, Dampfbad), Ruhebereiche, Fitness. Übernachtungsgäste haben freien Zutritt.', 300),
('Restaurant & Kulinarik', 'gourmet', 'Hauseigenes Restaurant, regional-saisonal. Galadinner, Buffets, Themenabende. Vegan, vegetarisch, halal, glutenfrei nach Absprache.', 310),
('Outdoor & Aktivprogramm', 'outdoor', 'Zwei Terrassen, Garten. Kooperation Simply Outdoor: Floßbau, Bogenschießen, GPS-Schnitzeljagd, Kochkurse, Survival.', 320),
('Übernachtung', 'hotel', '165 Zimmer & Suiten in vier Kategorien. Klimatisiert, Tageslicht, kostenfreies WLAN, Schreibtisch.', 400),
('Lage & Anfahrt', 'kontakt', 'Ingolstädter Str. 121, 85080 Gaimersheim. 5 Min A9. Kostenfreie Parkplätze. Bahnhof Ingolstadt 8 km. Flughafen München 75 km.', 500),
('Kontakt Bankett', 'kontakt', 'Bankett-Team: +49 8458 64-0, reservierung@der-heidehof.de. Antwort innerhalb 24h Mo–Fr.', 510);
