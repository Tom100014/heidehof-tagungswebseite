
-- 1. clara_conversations: remove unrestricted UPDATE policy
DROP POLICY IF EXISTS "anyone update own conversation by session" ON public.clara_conversations;

-- 2. clara_prompts: restrict SELECT to admins
DROP POLICY IF EXISTS "public read clara_prompts" ON public.clara_prompts;

-- 3. clara_widget_configs: remove public read (token exposure)
DROP POLICY IF EXISTS "active widgets public read" ON public.clara_widget_configs;

-- 4. menu_category_prompts: admin only
DROP POLICY IF EXISTS "public read prompts" ON public.menu_category_prompts;

-- 5. wellness_category_prompts: admin only
DROP POLICY IF EXISTS "public read category prompts" ON public.wellness_category_prompts;

-- 6. Fix mutable search_path on email queue helpers
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 7. Revoke public/anon execute on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_status_by_room(text, date, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.match_archive(extensions.vector, integer, text, text) FROM anon, public;
