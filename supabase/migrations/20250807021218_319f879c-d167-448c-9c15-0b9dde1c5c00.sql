-- Create trigger function to setup blog automation cron jobs
CREATE OR REPLACE FUNCTION setup_blog_automation_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing cron jobs for blog automation
  PERFORM cron.unschedule('automated-blog-generation-08-00');
  PERFORM cron.unschedule('automated-blog-generation-16-00');
  PERFORM cron.unschedule('automated-blog-generation-hourly');
  
  -- Create comprehensive cron job that checks all schedules every hour
  PERFORM cron.schedule(
    'automated-blog-generation-hourly',
    '0 * * * *', -- Every hour at minute 0
    $$
    SELECT net.http_post(
      url => 'https://obwhklmahawqmwyfzkke.supabase.co/functions/v1/automated-blog-generator',
      headers => '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2hrbG1haGF3cW13eWZ6a2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDQwMzIsImV4cCI6MjA1OTk4MDAzMn0.1lWvGLJIvhTgzJJRJweESnqtem2sr5zEnBIS_ExH4GQ"}'::jsonb,
      body => '{"trigger_type": "cron", "execution_context": "automated_hourly"}'::jsonb
    );
    $$
  );
END;
$$;

-- Setup cron jobs
SELECT setup_blog_automation_cron();

-- Add random CTA button functionality to existing CTA systems
CREATE OR REPLACE FUNCTION get_random_active_cta_buttons(p_max_buttons integer DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cta_buttons jsonb;
  v_active_buttons jsonb[];
  v_random_buttons jsonb := '[]'::jsonb;
  v_button jsonb;
  v_num_buttons integer;
BEGIN
  -- Get CTA buttons from settings
  SELECT setting_value INTO v_cta_buttons
  FROM blog_settings 
  WHERE setting_key = 'blog_cta_buttons';
  
  IF v_cta_buttons IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Filter active buttons
  SELECT array_agg(btn) INTO v_active_buttons
  FROM jsonb_array_elements(v_cta_buttons) btn
  WHERE (btn->>'isActive')::boolean = true;
  
  IF v_active_buttons IS NULL OR array_length(v_active_buttons, 1) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Determine random number of buttons (1 to p_max_buttons)
  v_num_buttons := (random() * (p_max_buttons - 1))::integer + 1;
  v_num_buttons := LEAST(v_num_buttons, array_length(v_active_buttons, 1));
  
  -- Shuffle and select random buttons
  FOR i IN 1..v_num_buttons LOOP
    v_button := v_active_buttons[1 + (random() * (array_length(v_active_buttons, 1) - 1))::integer];
    v_random_buttons := v_random_buttons || jsonb_build_array(v_button);
    
    -- Remove selected button from array to avoid duplicates
    v_active_buttons := array_remove(v_active_buttons, v_button);
    
    -- Exit if no more buttons available
    IF array_length(v_active_buttons, 1) = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_random_buttons;
END;
$$;