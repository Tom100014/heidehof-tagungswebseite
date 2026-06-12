// ElevenLabs Post-Call Webhook for Maximilian
// Receives: conversation_id, agent_id, status, transcript, audio URL, metadata (incl. clara_context)
// Persists in elevenlabs_conversations + extracts structured action via Lovable AI Gateway
// and routes into: tagungs_inquiries, restaurant_reservations, wellness_appointments, complaints

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, elevenlabs-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface Turn { role: string; message?: string; text?: string; time_in_call_secs?: number }

const routerTool = {
  type: "function" as const,
  function: {
    name: "route_call",
    description: "Klassifiziert das Gespräch und extrahiert die Felder für die richtige Admin-Tabelle.",
    parameters: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: ["tagungsanfrage", "tischreservierung", "spa_termin", "beschwerde", "info_only"],
          description: "Welche Art von Vorgang ist das?",
        },
        summary: { type: "string", description: "2-3 Sätze professionelle Zusammenfassung." },
        name: { type: "string" },
        email: { type: "string" },
        telefon: { type: "string" },
        firma: { type: "string" },
        // Tagung
        anlass: { type: "string" },
        personen: { type: "string" },
        datum: { type: "string" },
        dauer: { type: "string" },
        uebernachtung: { type: "string" },
        verpflegung: { type: "string" },
        technik: { type: "string" },
        besonderheiten: { type: "string" },
        // Tisch
        reservation_date: { type: "string", description: "YYYY-MM-DD" },
        reservation_time: { type: "string", description: "HH:MM" },
        party_size: { type: "number" },
        // Spa
        treatment: { type: "string" },
        wunschtermin: { type: "string" },
        // Beschwerde
        complaint_category: { type: "string" },
        severity: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["action_type", "summary"],
      additionalProperties: false,
    },
  },
};

async function extract(transcriptText: string): Promise<Record<string, any>> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du analysierst Telefongespräche im Hotel Der Heidehof. Klassifiziere den Vorgang und extrahiere die Felder. Lass Felder leer, wenn unklar." },
          { role: "user", content: transcriptText },
        ],
        tools: [routerTool],
        tool_choice: { type: "function", function: { name: "route_call" } },
      }),
    });
    if (!r.ok) { console.warn("AI extract failed:", r.status, await r.text()); return { action_type: "info_only", summary: "Automatische Extraktion fehlgeschlagen." }; }
    const j = await r.json();
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
    return call ? JSON.parse(call.function.arguments) : { action_type: "info_only", summary: "" };
  } catch (e) {
    console.error("extract error", e);
    return { action_type: "info_only", summary: "" };
  }
}

async function routeAction(fields: Record<string, any>, transcript: Turn[], conversationId: string): Promise<{ type: string; id: string | null }> {
  const t = fields.action_type;
  const contact = [fields.email, fields.telefon].filter(Boolean).join(" / ");
  try {
    if (t === "tagungsanfrage") {
      const { data } = await admin.from("tagungs_inquiries").insert({
        zusammenfassung: fields.summary, name: fields.name, email: fields.email, telefon: fields.telefon,
        firma: fields.firma, anlass: fields.anlass, personen: fields.personen, datum: fields.datum,
        dauer: fields.dauer, uebernachtung: fields.uebernachtung, verpflegung: fields.verpflegung,
        technik: fields.technik, besonderheiten: fields.besonderheiten,
        conversation: transcript, email_sent: false, source: "maximilian",
      }).select("id").single();
      return { type: t, id: data?.id ?? null };
    }
    if (t === "tischreservierung") {
      const { data } = await admin.from("restaurant_reservations").insert({
        guest_name: fields.name || "Maximilian-Anruf",
        contact: contact || null,
        persons: fields.party_size || 2,
        reservation_date: fields.reservation_date,
        reservation_time: fields.reservation_time,
        notes: fields.summary,
        status: "pending",
        source: "maximilian",
        session_id: conversationId,
      }).select("id").single();
      return { type: t, id: data?.id ?? null };
    }
    if (t === "spa_termin") {
      const { data } = await admin.from("beauty_bookings").insert({
        guest_name: fields.name || "Maximilian-Anruf",
        guest_email: fields.email,
        guest_phone: fields.telefon,
        treatment_title: fields.treatment || "Anfrage über Maximilian",
        notes: `${fields.wunschtermin ? `Wunschtermin: ${fields.wunschtermin}\n` : ""}${fields.summary || ""}`,
        status: "pending",
        source: "maximilian",
      }).select("id").single();
      return { type: t, id: data?.id ?? null };
    }
    if (t === "beschwerde") {
      const { data } = await admin.from("complaints").insert({
        guest_name: fields.name,
        contact: contact || null,
        category: fields.complaint_category || "general",
        urgency: fields.severity || "medium",
        description: fields.summary,
        status: "open",
        source: "maximilian",
      }).select("id").single();
      return { type: t, id: data?.id ?? null };
    }
  } catch (e) {
    console.error(`routeAction ${t} error`, e);
  }
  return { type: "info_only", id: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const payload = await req.json();
    // ElevenLabs sendet entweder direkt das Conversation-Objekt oder mit { data: {...} } wrapper
    const data = payload.data ?? payload;

    const conversationId: string = data.conversation_id || data.id || crypto.randomUUID();
    const agentId: string = data.agent_id || "unknown";
    const status: string = data.status || "done";
    const transcript: Turn[] = data.transcript || data.transcript_with_tool_calls || [];
    const audioUrl: string | null = data.audio_url || data.recording_url || null;
    const metadata = data.metadata || data.conversation_initiation_client_data || {};
    const claraContext = metadata.clara_context || metadata.dynamic_variables?.clara_context || null;
    const durationSecs: number | null = data.metadata?.call_duration_secs ?? data.duration_secs ?? null;

    const transcriptText = transcript
      .map((t) => `${(t.role || "").toUpperCase()}: ${t.message ?? t.text ?? ""}`)
      .join("\n");

    // 1. Extract via AI
    const fields = transcriptText ? await extract(transcriptText) : { action_type: "info_only", summary: "" };

    // 2. Route to admin table
    const action = await routeAction(fields, transcript, conversationId);

    // 3. Persist conversation row (upsert by conversation_id)
    const { data: row, error } = await admin
      .from("elevenlabs_conversations")
      .upsert({
        conversation_id: conversationId,
        agent_id: agentId,
        status,
        ended_at: new Date().toISOString(),
        duration_seconds: durationSecs,
        transcript,
        audio_url: audioUrl,
        clara_context: claraContext,
        summary: fields.summary || null,
        extracted_fields: fields,
        triggered_action_type: action.type,
        triggered_action_id: action.id,
        metadata,
      }, { onConflict: "conversation_id" })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: row.id, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
