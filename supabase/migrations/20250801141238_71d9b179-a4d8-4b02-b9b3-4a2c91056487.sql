-- Prüfe welche message_types erlaubt sind
SELECT unnest(enum_range(NULL::message_type)) AS allowed_message_types;