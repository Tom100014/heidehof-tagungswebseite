-- Prüfe den aktuellen CHECK constraint für message_type
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'admin_messages')
  AND contype = 'c'
  AND conname LIKE '%message_type%';