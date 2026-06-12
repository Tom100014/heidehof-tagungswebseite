
-- Erstellt eine gespeicherte Funktion, um alle Daten aus einer Tabelle zu löschen
CREATE OR REPLACE FUNCTION admin_delete_all_from_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Mit den Rechten des Erstellers ausführen (Superuser)
AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
END;
$$;

-- Berechtigungen für die Funktion setzen
ALTER FUNCTION admin_delete_all_from_table(text) SECURITY DEFINER;
REVOKE ALL ON FUNCTION admin_delete_all_from_table(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_all_from_table(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_all_from_table(text) TO service_role;
