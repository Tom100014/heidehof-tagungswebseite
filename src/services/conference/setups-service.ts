import { supabase } from "@/integrations/supabase/client";

export type RoomSetup = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  capacity_range: string | null;
  ideal_for: string | null;
  image_url: string | null;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function fetchRoomSetups(): Promise<RoomSetup[]> {
  const { data, error } = await supabase
    .from("room_setups")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as RoomSetup[];
}

export async function updateRoomSetup(id: string, patch: Partial<RoomSetup>): Promise<void> {
  const { error } = await supabase.from("room_setups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function uploadSetupImage(setupId: string, slug: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${slug}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("setup-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("setup-images").getPublicUrl(path);
  const url = pub.publicUrl;
  await updateRoomSetup(setupId, { image_url: url, storage_path: path });
  return url;
}
