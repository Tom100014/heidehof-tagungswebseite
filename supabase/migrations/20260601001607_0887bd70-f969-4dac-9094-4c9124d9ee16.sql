DELETE FROM public.clara_knowledge
WHERE title = 'Neuer Eintrag' AND (content IS NULL OR length(trim(content)) = 0);