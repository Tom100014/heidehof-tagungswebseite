
-- Ensure unique title for upserts (matches sync function expectation)
create unique index if not exists clara_media_title_uidx on public.clara_media (title);

-- 1) Speisen
insert into public.clara_media (title, description, category, tags, triggers, media_type, url, caption, is_active)
select f.title, coalesce(f.description,''), 'speise',
  array_remove(array_cat(array[f.course::text], coalesce(f.tags,'{}'::text[])), null),
  array_remove(array['speise','speisekarte','essen','gericht','menu', f.course::text, lower(f.title)], null),
  'image', f.image_url, f.title || coalesce(' – ' || f.price_label,''), f.is_active
from public.food_menu f where f.image_url is not null
on conflict (title) do update set url=excluded.url, description=excluded.description, category=excluded.category,
  tags=excluded.tags, triggers=excluded.triggers, caption=excluded.caption, is_active=excluded.is_active;

-- 2) Getränke
insert into public.clara_media (title, description, category, tags, triggers, media_type, url, caption, is_active)
select d.title, coalesce(d.description,''), 'getraenke',
  array_remove(array_cat(array[d.category::text], coalesce(d.tags,'{}'::text[])), null),
  array_remove(array['getränk','getraenk','drink','getraenkekarte', d.category::text, lower(d.title)], null),
  'image', d.image_url, d.title || coalesce(' – ' || d.price_label,''), d.is_active
from public.drinks_menu d where d.image_url is not null
on conflict (title) do update set url=excluded.url, description=excluded.description, category=excluded.category,
  tags=excluded.tags, triggers=excluded.triggers, caption=excluded.caption, is_active=excluded.is_active;

-- 3) Wellness/Beauty Treatments
insert into public.clara_media (title, description, category, tags, triggers, media_type, url, caption, is_active)
select t.title, coalesce(t.description,''),
  case when t.category::text like 'beauty%' or t.category::text in ('hand_fuss','depilation') then 'beauty' else 'spa' end,
  array_remove(array_cat(array[t.category::text], coalesce(t.tags,'{}'::text[])), null),
  array_remove(array['spa','wellness','beauty','behandlung','anwendung', t.category::text, lower(t.title)], null),
  'image', t.image_url, t.title || coalesce(' – ' || t.price_label,''), t.is_active
from public.wellness_treatments t where t.image_url is not null
on conflict (title) do update set url=excluded.url, description=excluded.description, category=excluded.category,
  tags=excluded.tags, triggers=excluded.triggers, caption=excluded.caption, is_active=excluded.is_active;

-- 4) Wellness-Sektionen
insert into public.clara_media (title, description, category, tags, triggers, media_type, url, caption, is_active)
select s.title, coalesce(s.subtitle, coalesce(s.body_md,'')),
  case when s.page::text = 'spa' then 'spa' else 'wellness' end,
  array[s.slug, s.page::text],
  array_remove(array[s.page::text, s.slug, lower(s.title), 'spa','wellness','pool','sauna'], null),
  'image', s.hero_image_url, s.title, s.is_active
from public.wellness_sections s where s.hero_image_url is not null
on conflict (title) do update set url=excluded.url, description=excluded.description, category=excluded.category,
  tags=excluded.tags, triggers=excluded.triggers, is_active=excluded.is_active;

-- 5) Events
insert into public.clara_media (title, description, category, tags, triggers, media_type, url, caption, is_active)
select e.title, coalesce(e.subtitle,''), 'veranstaltung',
  array_remove(array_cat(array[e.event_type::text], coalesce(e.tags,'{}'::text[])), null),
  array_remove(array['veranstaltung','event','seminar','workshop', e.event_type::text, lower(e.title)], null),
  'image', e.hero_image_url, e.title || coalesce(' – ' || e.price_label,''), e.is_active and e.is_published
from public.events e where e.hero_image_url is not null
on conflict (title) do update set url=excluded.url, description=excluded.description, category=excluded.category,
  tags=excluded.tags, triggers=excluded.triggers, is_active=excluded.is_active;
