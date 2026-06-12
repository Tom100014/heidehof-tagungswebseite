import { supabase } from "@/integrations/supabase/client";

export type MealType = "lunch" | "dinner";
export type DishType = "fish" | "meat" | "vegetarian";
export type Course = "appetizer" | "main" | "dessert";

export interface OrderItemInput {
  menu_id: string;
  course: Course;
  dish_type: DishType | null;
  quantity: number;
}

export interface CreateOrderPayload {
  guest_name: string;
  company?: string;
  email?: string;
  notes?: string;
  service_date: string;
  room_id: string;
  meal_type: MealType;
  menu_id: string;
  participants: number;
  items: OrderItemInput[];
}

export async function createConferenceOrder(payload: CreateOrderPayload) {
  const { items, ...order } = payload;
  const { data: orderRow, error: orderErr } = await supabase
    .from("conference_orders")
    .insert(order)
    .select()
    .single();
  if (orderErr) throw orderErr;

  if (items.length) {
    const rows = items.map((it) => ({ ...it, order_id: orderRow.id }));
    const { error: itemsErr } = await supabase.from("conference_order_items").insert(rows);
    if (itemsErr) throw itemsErr;
  }
  return orderRow;
}

export interface KitchenAggregate {
  room_id: string;
  room_name: string;
  participants: number;
  fish: number;
  meat: number;
  vegetarian: number;
}

export async function fetchKitchenBreakdown(date: string, meal: MealType) {
  const { data: orders, error } = await supabase
    .from("conference_orders")
    .select("id, room_id, participants")
    .eq("service_date", date)
    .eq("meal_type", meal);
  if (error) throw error;

  const orderIds = (orders ?? []).map((o) => o.id);
  if (!orderIds.length) return [] as KitchenAggregate[];

  const [{ data: items }, { data: rooms }] = await Promise.all([
    supabase
      .from("conference_order_items")
      .select("order_id, course, dish_type, quantity")
      .in("order_id", orderIds)
      .eq("course", "main"),
    supabase.from("conference_rooms").select("id, name"),
  ]);

  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const agg = new Map<string, KitchenAggregate>();
  for (const o of orders ?? []) {
    if (!agg.has(o.room_id)) {
      agg.set(o.room_id, {
        room_id: o.room_id,
        room_name: roomMap.get(o.room_id) ?? "Raum",
        participants: 0,
        fish: 0,
        meat: 0,
        vegetarian: 0,
      });
    }
    agg.get(o.room_id)!.participants += o.participants ?? 0;
  }
  const orderToRoom = new Map((orders ?? []).map((o) => [o.id, o.room_id]));
  for (const it of items ?? []) {
    const roomId = orderToRoom.get(it.order_id);
    if (!roomId) continue;
    const a = agg.get(roomId);
    if (!a || !it.dish_type) continue;
    a[it.dish_type as DishType] += it.quantity ?? 0;
  }
  return Array.from(agg.values()).sort((a, b) => a.room_name.localeCompare(b.room_name));
}
