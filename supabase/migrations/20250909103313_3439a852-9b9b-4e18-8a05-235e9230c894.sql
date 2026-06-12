-- Create the missing admin function for the admin-reset edge function
CREATE OR REPLACE FUNCTION public.admin_delete_all_from_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check: Only allow certain tables to be reset
  IF table_name NOT IN (
    'test_data', 'temp_data', 'demo_data', 'sample_data',
    'unified_form_submissions', 'restaurant_reservations', 
    'appointments', 'complaints', 'conference_orders',
    'restaurant_orders', 'restaurant_bar_orders', 'shop_orders'
  ) THEN
    RAISE EXCEPTION 'Table % is not allowed for reset operations', table_name;
  END IF;
  
  -- Log the admin action
  PERFORM public.log_admin_action(
    'admin_table_reset',
    table_name,
    null::text,
    null::jsonb,
    jsonb_build_object('action', 'DELETE_ALL', 'timestamp', now())
  );
  
  -- Execute the delete operation
  EXECUTE format('DELETE FROM %I', table_name);
  
  -- Log success
  PERFORM public.log_admin_action(
    'admin_table_reset_success',
    table_name,
    null::text,
    null::jsonb,
    jsonb_build_object('action', 'DELETE_ALL_COMPLETED', 'timestamp', now())
  );
END;
$function$;