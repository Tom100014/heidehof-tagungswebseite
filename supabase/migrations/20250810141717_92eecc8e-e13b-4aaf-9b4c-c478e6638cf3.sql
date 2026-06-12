-- Bestätige die E-Mail für den Admin-Account
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'admin@heidehof.com' AND email_confirmed_at IS NULL;