import { supabase } from "@/integrations/supabase/client";

export type RoomCategory = "tagungscenter" | "art-center";

export interface ConferenceRoom {
  id: string;
  name: string;
  subtitle: string | null;
  category: RoomCategory;
  capacity: number;
  description: string | null;
  image_url: string | null;
  equipment: string[];
  style: string | null;
  is_active: boolean;
  sort_order: number;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  area_sqm: number | null;
  cap_theater: number | null;
  cap_parlament: number | null;
  cap_uform: number | null;
  cap_block: number | null;
  cap_bankett: number | null;
}

export interface RoomImage {
  id: string;
  room_id: string;
  url: string;
  storage_path: string | null;
  is_primary: boolean;
  source: string;
  created_at: string;
  tags: string[];
  caption: string | null;
  sort_order: number;
}

export async function fetchRooms(): Promise<ConferenceRoom[]> {
  const { data, error } = await supabase
    .from("conference_rooms")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as ConferenceRoom[];
}

export async function upsertRoom(room: Partial<ConferenceRoom> & { name: string; capacity: number }) {
  const payload: Record<string, unknown> = {
    name: room.name,
    subtitle: room.subtitle ?? null,
    category: room.category ?? "tagungscenter",
    capacity: room.capacity,
    description: room.description ?? null,
    equipment: room.equipment ?? [],
    style: room.style ?? "modern",
    image_url: room.image_url ?? null,
    is_active: room.is_active ?? true,
    sort_order: room.sort_order ?? 0,
    length_m: room.length_m ?? null,
    width_m: room.width_m ?? null,
    height_m: room.height_m ?? null,
    area_sqm: room.area_sqm ?? null,
    cap_theater: room.cap_theater ?? null,
    cap_parlament: room.cap_parlament ?? null,
    cap_uform: room.cap_uform ?? null,
    cap_block: room.cap_block ?? null,
    cap_bankett: room.cap_bankett ?? null,
    ...(room.id ? { id: room.id } : {}),
  };
  const { data, error } = await supabase
    .from("conference_rooms")
    .upsert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ConferenceRoom;
}

export async function deleteRoom(id: string) {
  const { error } = await supabase.from("conference_rooms").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchRoomImages(roomId: string) {
  const { data, error } = await supabase
    .from("room_images")
    .select("*")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RoomImage[];
}

export async function updateRoomImage(
  imageId: string,
  patch: Partial<Pick<RoomImage, "tags" | "caption" | "sort_order">>,
) {
  const { error } = await supabase
    .from("room_images")
    .update(patch as never)
    .eq("id", imageId);
  if (error) throw error;
}

export async function reorderRoomImages(images: { id: string; sort_order: number }[]) {
  await Promise.all(
    images.map((img) =>
      supabase.from("room_images").update({ sort_order: img.sort_order } as never).eq("id", img.id),
    ),
  );
}

export async function uploadRoomImage(roomId: string, file: File) {
  const path = `${roomId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const { error: upErr } = await supabase.storage.from("room-images").upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("room-images").getPublicUrl(path);
  const { data, error } = await supabase
    .from("room_images")
    .insert({ room_id: roomId, url: pub.publicUrl, storage_path: path, source: "upload" })
    .select()
    .single();
  if (error) throw error;
  return data as RoomImage;
}

export async function generateRoomImage(roomId: string, prompt: string, style: string) {
  const { data, error } = await supabase.functions.invoke("generate-room-image", {
    body: { room_id: roomId, prompt, style },
  });
  if (error) throw error;
  return data;
}

export async function setPrimaryImage(roomId: string, imageId: string, url: string) {
  await supabase.from("room_images").update({ is_primary: false }).eq("room_id", roomId);
  await supabase.from("room_images").update({ is_primary: true }).eq("id", imageId);
  await supabase.from("conference_rooms").update({ image_url: url }).eq("id", roomId);
}

export async function deleteRoomImage(img: RoomImage) {
  if (img.storage_path) await supabase.storage.from("room-images").remove([img.storage_path]);
  await supabase.from("room_images").delete().eq("id", img.id);
}

export interface RoomStats {
  bookings: number;
  participants: number;
  fish: number;
  meat: number;
  vegetarian: number;
}

export async function fetchRoomStats(roomId: string, dateFrom: string, dateTo: string): Promise<RoomStats> {
  const { data: orders } = await supabase
    .from("conference_orders")
    .select("id, participants")
    .eq("room_id", roomId)
    .gte("service_date", dateFrom)
    .lte("service_date", dateTo);
  const ids = (orders ?? []).map((o) => o.id);
  const stats: RoomStats = {
    bookings: orders?.length ?? 0,
    participants: (orders ?? []).reduce((s, o) => s + (o.participants ?? 0), 0),
    fish: 0, meat: 0, vegetarian: 0,
  };
  if (!ids.length) return stats;
  const { data: items } = await supabase
    .from("conference_order_items")
    .select("dish_type, quantity")
    .in("order_id", ids)
    .eq("course", "main");
  for (const it of items ?? []) {
    if (it.dish_type === "fish") stats.fish += it.quantity ?? 0;
    if (it.dish_type === "meat") stats.meat += it.quantity ?? 0;
    if (it.dish_type === "vegetarian") stats.vegetarian += it.quantity ?? 0;
  }
  return stats;
}
