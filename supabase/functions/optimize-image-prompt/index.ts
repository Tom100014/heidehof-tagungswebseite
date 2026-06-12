import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferenceItem {
  id: string;
  label: string;
  description?: string;
  image_url: string;
  role: string;
  user_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;

  try {
    const { entityTitle, entityDescription, scope, references, mode = "prompt" } = await req.json();

    if (!entityTitle) {
      return new Response(JSON.stringify({ error: "entityTitle is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing on server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userMessageContent = "";

    if (mode === "description") {
      systemPrompt = `You are an expert copywriter for a luxury 5-star hotel and restaurant "Heidehof".
Your task is to write a highly appealing, mouth-watering, or premium product/service description in German.
It should be suitable for a high-end menu (food/drinks), event, or spa treatment.
Keep it extremely elegant, concise (exactly one short sentence or phrase, maximum 15-20 words), and written in sophisticated German.
Do not include any chat introduction, quote marks, or explanation. Output ONLY the description text itself.`;

      userMessageContent = `Write an elegant, German description for:
- Product/Service Title: ${entityTitle}
- Category/Scope: ${scope ?? 'general'}`;
    } else {
      // Build the instruction prompt for Gemini
      systemPrompt = `You are an expert AI prompt engineer for image generation models.
Your task is to write a highly detailed, professional, and visually stunning image generation prompt in English.
This prompt is for a product/service at the luxury 5-star hotel "Heidehof".

You must combine the details of the product/subject with specific reference images that have designated roles (e.g. background, glassware, lighting).

Your response must contain ONLY the final English prompt as a single cohesive paragraph. Do not include any JSON, introduction, markdown, quote marks, or chat explanations. Just output the prompt text itself.

Guidelines:
1. Write in English.
2. Describe the main subject (product: "${entityTitle}") in vivid, appetizing, or luxurious detail. If description is provided, use its details: "${entityDescription ?? ''}".
3. Respect the scope/category: "${scope ?? 'general'}".
4. Integrate selected reference images based on their roles and user notes:
   - For a reference with role "Hintergrund / Umgebung", describe its environment/background in the prompt.
   - For a reference with role "Geschirr / Gläser / Behälter", describe its vessels/tableware.
   - For a reference with role "Beleuchtung / Lichtstimmung", describe the atmosphere and light.
   - For a reference with role "Stil / Komposition / Winkel", describe the composition, camera angle, and artistic style.
   - For a reference with role "Detail-Element / Dekoration", describe these decorative elements.
5. Apply professional photography keywords: "luxury hotel atmosphere, editorial food photography, commercial product shot, highly detailed, 8k resolution, shallow depth of field, warm elegant lighting".
6. Do NOT include any text, typography, logos, or watermarks in the prompt.`;

      userMessageContent = `Please create the optimized image prompt for:
- Product Title: ${entityTitle}
- Product Description: ${entityDescription ?? "N/A"}
- Scope: ${scope ?? "general"}

Selected Reference Images:
${(references as ReferenceItem[] ?? []).map((ref, idx) => `
Reference #${idx + 1}:
- Label: ${ref.label}
- Description: ${ref.description ?? "None"}
- URL: ${ref.image_url}
- Assigned Role: ${ref.role}
- Custom Notes: ${ref.user_notes ?? "None"}
`).join("\n")}

Synthesize these inputs into a single, cohesive, premium English image generation prompt.`;
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessageContent }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: `Lovable AI Gateway error: ${txt}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const resultText = aiData?.choices?.[0]?.message?.content?.trim();

    if (!resultText) {
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "description") {
      return new Response(JSON.stringify({ description: resultText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ prompt: resultText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
