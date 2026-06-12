import { supabase } from "@/integrations/supabase/client";

export type ImageQuality = "standard" | "professional" | "editorial";
export type PortionSize = "small" | "medium" | "large" | "tasting";
export type ImagePerspective = "angle_45" | "top_down" | "side";
export type ImageLighting = "warm" | "natural" | "dramatic";

export interface ImageReferences {
  background_url?: string;
  plates_url?: string;
  glasses_url?: string;
  cutlery_url?: string;
  mood_url?: string;
}

export interface ImageGenerationStyle {
  quality: ImageQuality;
  portion_size: PortionSize;
  perspective: ImagePerspective;
  lighting: ImageLighting;
  extra_instructions?: string;
}

export const DEFAULT_STYLE: ImageGenerationStyle = {
  quality: "professional",
  portion_size: "medium",
  perspective: "angle_45",
  lighting: "warm",
  extra_instructions: "",
};

const REFERENCES_KEY = "image_references";
const STYLE_KEY = "image_generation_style";

export async function loadImageReferences(): Promise<ImageReferences> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", REFERENCES_KEY)
    .maybeSingle();
  return (data?.value as ImageReferences) ?? {};
}

export async function saveImageReferences(refs: ImageReferences): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert({
    key: REFERENCES_KEY,
    value: refs as unknown as never,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadImageStyle(): Promise<ImageGenerationStyle> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", STYLE_KEY)
    .maybeSingle();
  return { ...DEFAULT_STYLE, ...((data?.value as Partial<ImageGenerationStyle>) ?? {}) };
}

export async function saveImageStyle(style: ImageGenerationStyle): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert({
    key: STYLE_KEY,
    value: style as unknown as never,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function uploadReferenceImage(
  file: File,
  slot: keyof ImageReferences
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${slot}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("image-references")
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("image-references").getPublicUrl(path);
  return data.publicUrl;
}
