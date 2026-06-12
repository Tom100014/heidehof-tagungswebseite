// cartesia-tools-sync – Auto-sync der Tool-Definitionen an den Cartesia-Agent.
// Wird vom DB-Trigger ausgeloest, wenn sich Inhalte aendern, die Tools/Prompt
// beeinflussen koennten. Idempotent. verify_jwt = false, damit pg_net rufen kann.
// Schreibt das Ergebnis nach app_settings.cartesia_agent_last_sync.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildToolPayloads,
  CARTESIA_TOOLS,
  pushAndVerifyTools,
  readCartesiaApiKey,
} from "../_shared/cartesia-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = readCartesiaApiKey();
    const result = await pushAndVerifyTools(apiKey);

    await admin.from("app_settings").upsert({
      key: "cartesia_agent_last_sync",
      value: result,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    return new Response(JSON.stringify({
      ok: result.success,
      ...result,
      tools_configured: CARTESIA_TOOLS.map((t) => t.name),
      tool_definitions: buildToolPayloads(),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cartesia-tools-sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
