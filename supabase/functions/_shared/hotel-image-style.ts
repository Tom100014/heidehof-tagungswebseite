// Shared helper used by every image-generating edge function so that
// the hotel-wide style settings + reference images are baked into every prompt.

export interface ImageReferences {
  background_url?: string;
  plates_url?: string;
  glasses_url?: string;
  cutlery_url?: string;
  mood_url?: string;
}

export interface ImageGenerationStyle {
  quality: "standard" | "professional" | "editorial";
  portion_size: "small" | "medium" | "large" | "tasting";
  perspective: "angle_45" | "top_down" | "side";
  lighting: "warm" | "natural" | "dramatic";
  extra_instructions?: string;
}

const QUALITY_TEXT: Record<ImageGenerationStyle["quality"], string> = {
  standard: "Hochwertige, saubere Food-Fotografie.",
  professional: "Professionelle Hotel-Fine-Dining Food-Fotografie, Magazin-Qualität, makellos arrangiert.",
  editorial: "Editorial-Niveau wie Michelin-Magazin, künstlerische Komposition, perfekte Tiefenschärfe.",
};

const PORTION_TEXT: Record<ImageGenerationStyle["portion_size"], string> = {
  small: "kleine, dezente Portion (Amuse-Bouche-Stil)",
  medium: "ausgewogene mittlere Portion",
  large: "großzügige Portion",
  tasting: "kleine Tasting-Menü-Portion mit viel Tellerfläche",
};

const PERSPECTIVE_TEXT: Record<ImageGenerationStyle["perspective"], string> = {
  angle_45: "45-Grad-Perspektive auf den Teller",
  top_down: "exakte Vogelperspektive (top-down)",
  side: "seitliche Perspektive in Augenhöhe",
};

const LIGHTING_TEXT: Record<ImageGenerationStyle["lighting"], string> = {
  warm: "warmes, einladendes Restaurant-Licht",
  natural: "weiches, natürliches Tageslicht",
  dramatic: "dramatisches, kontrastreiches Studio-Licht",
};

export const DEFAULT_STYLE: ImageGenerationStyle = {
  quality: "professional",
  portion_size: "medium",
  perspective: "angle_45",
  lighting: "warm",
  extra_instructions: "",
};

export async function loadHotelStyle(supabase: any): Promise<{
  style: ImageGenerationStyle;
  references: ImageReferences;
}> {
  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ["image_generation_style", "image_references"]);
  const map: Record<string, unknown> = {};
  (data ?? []).forEach((r: { key: string; value: unknown }) => { map[r.key] = r.value; });
  return {
    style: { ...DEFAULT_STYLE, ...((map.image_generation_style as Partial<ImageGenerationStyle>) ?? {}) },
    references: (map.image_references as ImageReferences) ?? {},
  };
}

export function buildHotelStylePrompt(basePrompt: string, style: ImageGenerationStyle): string {
  const parts = [
    basePrompt.trim(),
    QUALITY_TEXT[style.quality],
    `Portionsgröße: ${PORTION_TEXT[style.portion_size]}.`,
    `Perspektive: ${PERSPECTIVE_TEXT[style.perspective]}.`,
    `Beleuchtung: ${LIGHTING_TEXT[style.lighting]}.`,
    "Verwende exakt das Geschirr, die Gläser und das Tisch-Setting wie in den beigefügten Referenzbildern – Farbe, Material und Form müssen übereinstimmen.",
    "Kein Text, keine Logos, keine Wasserzeichen.",
  ];
  if (style.extra_instructions?.trim()) parts.push(style.extra_instructions.trim());
  return parts.filter(Boolean).join(" ");
}

export function buildReferenceContent(prompt: string, references: ImageReferences): unknown {
  const refUrls = [
    references.background_url,
    references.plates_url,
    references.glasses_url,
    references.cutlery_url,
    references.mood_url,
  ].filter(Boolean) as string[];

  if (refUrls.length === 0) return prompt;

  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const url of refUrls) {
    content.push({ type: "image_url", image_url: { url } });
  }
  return content;
}
