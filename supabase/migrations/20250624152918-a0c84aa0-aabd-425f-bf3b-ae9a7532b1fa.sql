
-- Lösche alle Edge Functions die zum alten Blog Master Editor gehören
-- (Diese werden automatisch aus dem Code entfernt, aber wir dokumentieren es hier)

-- Lösche alle Tabellen und Daten die spezifisch für den alten Blog Master Editor waren
-- Falls vorhanden: template_images, blog_template_configs, etc.
DROP TABLE IF EXISTS public.template_images CASCADE;
DROP TABLE IF EXISTS public.blog_template_configs CASCADE;
DROP TABLE IF EXISTS public.blog_workflow_states CASCADE;
DROP TABLE IF EXISTS public.legacy_blog_templates CASCADE;

-- Bereinige blog_posts Tabelle von Legacy-Spalten die nur für den alten Editor waren
ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS template_id CASCADE;
ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS template_images CASCADE;
ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS structured_content CASCADE;

-- Entferne alle AI-generierten Inhalte die vom alten System stammen
DELETE FROM public.ai_generated_content 
WHERE content_type IN ('blog_template', 'legacy_blog', 'template_content');

-- Bereinige API-Logs von alten Blog-Editor Aufrufen
DELETE FROM public.api_logs 
WHERE endpoint LIKE '%blog-template%' 
   OR endpoint LIKE '%generate-structured-content%'
   OR endpoint LIKE '%legacy-blog%';

-- Lösche alle gespeicherten Prompts die nur für den alten Editor waren
DELETE FROM public.ai_generated_content 
WHERE prompt LIKE '%template%blog%' 
   OR prompt LIKE '%structured%content%'
   OR prompt LIKE '%legacy%editor%';
