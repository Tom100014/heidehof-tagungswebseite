import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { action, email, redirectTo, role } = await req.json();
    if (action !== "invite_admin" && action !== "invite_user") return json({ error: "Unsupported action" }, 400);

    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: "Valid email required" }, 400);
    }
    const allowedRoles = new Set(["admin", "director", "service", "kitchen", "conference"]);
    const cleanRole = action === "invite_admin" ? "admin" : String(role ?? "service").trim().toLowerCase();
    if (!allowedRoles.has(cleanRole)) {
      return json({ error: "Unsupported role" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) return json({ error: "Server misconfigured" }, 500);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo: typeof redirectTo === "string" ? redirectTo : undefined,
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (userId) {
      const { error: roleError } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: cleanRole }, { onConflict: "user_id,role" });
      if (roleError) throw roleError;
    }

    return json({ ok: true, user_id: userId ?? null, role: cleanRole });
  } catch (error) {
    console.error("admin-users failed", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
