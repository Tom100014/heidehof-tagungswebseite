import { supabase } from "@/integrations/supabase/client";

export type ReferenceScope = "food" | "drinks" | "events" | "wellness" | "conference_menu";

export const SCOPE_LABELS: Record<ReferenceScope, string> = {
  food: "Speisekarte",
  drinks: "Getränkekarte",
  events: "Veranstaltungen",
  wellness: "Wellness & Spa",
  conference_menu: "Tagungsmenü",
};

export interface HotelReferenceImage {
  id: string;
  slug: string;
  label: string;
  description: string;
  category: string;
  scopes: ReferenceScope[];
  tags: string[];
  image_url: string;
  storage_path: string | null;
  source_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface PromptLayout {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  category: string;
  description: string | null;
  prompt_text: string;
  reference_image_ids: string[];
  is_active: boolean;
  is_builtin: boolean;
  sort_order: number;
}

export async function listReferenceImages(): Promise<HotelReferenceImage[]> {
  const { data, error } = await supabase
    .from("hotel_reference_images" as never)
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as HotelReferenceImage[];
}

export async function listReferenceImagesByScope(scope: ReferenceScope): Promise<HotelReferenceImage[]> {
  const { data, error } = await supabase
    .from("hotel_reference_images" as never)
    .select("*")
    .eq("is_active", true)
    .contains("scopes", [scope] as never)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as HotelReferenceImage[];
}

export async function deleteReferenceImage(id: string) {
  const { error } = await supabase
    .from("hotel_reference_images" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateReferenceImage(
  id: string,
  patch: Partial<Pick<HotelReferenceImage, "label" | "description" | "category" | "tags" | "scopes">>,
) {
  const { error } = await supabase
    .from("hotel_reference_images" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function uploadReferenceImageFile(
  file: File,
  slugBase: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `references/${slugBase}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("image-references")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("image-references").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function createReferenceImage(input: {
  slug: string;
  label: string;
  description?: string;
  category?: string;
  scopes?: ReferenceScope[];
  tags?: string[];
  image_url: string;
  storage_path?: string;
}) {
  const { error } = await supabase
    .from("hotel_reference_images" as never)
    .insert(input as never);
  if (error) throw error;
}

export async function importFromUrl(url: string, maxImages = 30) {
  const { data, error } = await supabase.functions.invoke("import-reference-images", {
    body: { url, maxImages },
  });
  if (error) throw error;
  return data as { imported_count: number; errors: unknown[] };
}

export async function importFromImageUrls(urls: string[]) {
  const { data, error } = await supabase.functions.invoke("import-reference-images", {
    body: { images: urls.map((url) => ({ url })) },
  });
  if (error) throw error;
  return data as { imported_count: number; errors: unknown[] };
}

// ---- Layouts ----

export async function listLayouts(): Promise<PromptLayout[]> {
  const { data, error } = await supabase
    .from("prompt_layouts" as never)
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as PromptLayout[];
}

export async function saveLayout(
  layout: Pick<PromptLayout, "slug" | "label" | "emoji" | "category" | "description" | "prompt_text" | "reference_image_ids">,
) {
  const { error } = await supabase
    .from("prompt_layouts" as never)
    .upsert(layout as never, { onConflict: "slug" });
  if (error) throw error;
}

export async function updateLayout(id: string, patch: Partial<PromptLayout>) {
  const { error } = await supabase
    .from("prompt_layouts" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLayout(id: string) {
  const { error } = await supabase
    .from("prompt_layouts" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
