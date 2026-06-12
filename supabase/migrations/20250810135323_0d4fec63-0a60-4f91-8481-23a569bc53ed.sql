
-- 1) Sichere Update-Logik per Trigger-Funktion
CREATE OR REPLACE FUNCTION public.enforce_admin_messages_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Nur bestimmte Spalten dürfen geändert werden
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Updating id is not allowed';
  END IF;

  IF NEW.message_type <> OLD.message_type
     OR NEW.source_form <> OLD.source_form
     OR NEW.recipient_type <> OLD.recipient_type
     OR NEW.recipient_contact <> OLD.recipient_contact
     OR NEW.message_content <> OLD.message_content
     OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
     OR NEW.guest_phone_number IS DISTINCT FROM OLD.guest_phone_number
     OR NEW.order_reference IS DISTINCT FROM OLD.order_reference
     OR NEW.room_number IS DISTINCT FROM OLD.room_number
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.metadata IS DISTINCT FROM OLD.metadata
     OR NEW.sent_at <> OLD.sent_at
     OR NEW.created_at <> OLD.created_at
  THEN
    RAISE EXCEPTION 'Only status, reply_content, replied_at, admin_notes may be updated';
  END IF;

  -- Status-Werte validieren
  IF NEW.status NOT IN ('sent','replied','completed','failed','pending') THEN
    RAISE EXCEPTION 'Invalid status value: %', NEW.status;
  END IF;

  -- replied_at automatisch setzen, wenn eine Antwort neu gesetzt wird oder Status auf 'replied' wechselt
  IF (NEW.reply_content IS NOT NULL AND OLD.reply_content IS NULL)
     OR (NEW.status = 'replied' AND OLD.status <> 'replied')
  THEN
    NEW.replied_at := COALESCE(NEW.replied_at, now());
  END IF;

  -- updated_at immer aktualisieren
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

-- 2) Trigger auf admin_messages setzen/erneuern
DROP TRIGGER IF EXISTS trg_enforce_admin_messages_update ON public.admin_messages;
CREATE TRIGGER trg_enforce_admin_messages_update
BEFORE UPDATE ON public.admin_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_admin_messages_update();

-- 3) Ergänzende RLS-Policy für UPDATE:
-- Variante A: öffentlich erlauben (Trigger begrenzt Änderungen)
DROP POLICY IF EXISTS "Allow limited public updates to admin_messages" ON public.admin_messages;
CREATE POLICY "Allow limited public updates to admin_messages"
ON public.admin_messages
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Hinweis: Falls du Variante B (nur angemeldet) willst, ersetzen durch:
-- USING (auth.uid() IS NOT NULL)
-- WITH CHECK (auth.uid() IS NOT NULL)
