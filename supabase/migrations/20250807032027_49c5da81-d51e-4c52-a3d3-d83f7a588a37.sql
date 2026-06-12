-- Entferne technische SEO-Kommentare aus bestehendem Blog-Post
UPDATE blog_posts 
SET content = TRIM(TRAILING FROM SUBSTRING(content FROM 1 FOR POSITION('---' IN content) - 1))
WHERE slug = 'hotel-der-heidehof-die-unbequeme-wahrheit-die-reiseportale-vertuschen' 
AND content LIKE '%Dieser Blog-Artikel integriert%';