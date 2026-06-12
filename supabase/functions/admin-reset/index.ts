
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

interface ResetRequest {
  table: string;
  adminKey?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Supabase client with admin rights
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json() as ResetRequest;
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract table and adminKey from request
    const { table, adminKey } = requestBody;
    
    // Validate required fields
    if (!table) {
      return new Response(
        JSON.stringify({ success: false, error: 'Table name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Security: ALWAYS require a configured admin key + matching value.
    // Previously this guard short-circuited when ADMIN_RESET_KEY was unset,
    // allowing unauthenticated callers to truncate any table.
    const ADMIN_RESET_KEY = Deno.env.get('ADMIN_RESET_KEY')
    if (!ADMIN_RESET_KEY || !adminKey || adminKey !== ADMIN_RESET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Additionally require an admin JWT in the Authorization header
    const { requireAdmin } = await import('../_shared/admin-auth.ts')
    const authFail = await requireAdmin(req)
    if (authFail) return authFail
    
    // Validate table name to prevent SQL injection
    const validTablePattern = /^[a-zA-Z0-9_]+$/
    if (!validTablePattern.test(table)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid table name format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Executing admin_delete_all_from_table for table: ${table}`);

    // Execute the truncate command with full admin privileges
    const { error } = await supabaseAdmin.rpc('admin_delete_all_from_table', {
      table_name: table
    });

    if (error) {
      console.error(`Error truncating table ${table}:`, error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully truncated table: ${table}`);

    return new Response(
      JSON.stringify({ success: true, table }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error in admin-reset function:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
