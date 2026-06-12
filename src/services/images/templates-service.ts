import { supabase } from "@/integrations/supabase/client";
import type { ImageGenerationStyle, ImageReferences } from "./image-style-service";

export interface ImageStyleTemplate {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  category: "card-type" | "occasion" | string;
  description: string | null;
  layout_hint: string | null;
  layout_instructions: string;
  style: Partial<ImageGenerationStyle>;
  reference_images: ImageReferences;
  preview_url: string | null;
  is_active: boolean;
  is_builtin: boolean;
  sort_order: number;
}

export async function loadTemplates(): Promise<ImageStyleTemplate[]> {
  const { data, error } = await supabase
    .from("image_style_templates" as never)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ImageStyleTemplate[];
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<ImageStyleTemplate, "style" | "reference_images" | "layout_instructions" | "label" | "description" | "preview_url">>
): Promise<void> {
  const { error } = await supabase
    .from("image_style_templates" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function uploadTemplateImage(
  file: File,
  templateSlug: string,
  slot: string
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `templates/${templateSlug}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("image-references")
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("image-references").getPublicUrl(path);
  return data.publicUrl;
}
