
-- Blog-Posts komplett löschen
DELETE FROM blog_posts;

-- Blog-Analytics (Statistiken) zurücksetzen
DELETE FROM blog_analytics;

-- Blog-Keywords löschen
DELETE FROM blog_keywords;

-- Sequences zurücksetzen falls vorhanden
-- (Das stellt sicher, dass IDs wieder bei 1 beginnen)
