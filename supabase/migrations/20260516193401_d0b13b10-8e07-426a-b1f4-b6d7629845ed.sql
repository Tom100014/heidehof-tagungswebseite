
create index if not exists clara_media_tags_gin on public.clara_media using gin (tags);
create index if not exists clara_media_triggers_gin on public.clara_media using gin (triggers);
create index if not exists clara_media_category_active_idx on public.clara_media (category, is_active, sort_order);
