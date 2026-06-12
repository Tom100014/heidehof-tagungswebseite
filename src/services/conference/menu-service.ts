import { supabase } from "@/integrations/supabase/client";

export interface MainDish {
  id: string;
  name: string;
  description: string;
  type: 'fish' | 'meat' | 'vegetarian';
}

export interface ConferenceMenu {
  id?: string;
  menu_date: string;
  lunch_appetizer: string;
  lunch_main_dish_fish: MainDish;
  lunch_main_dish_meat: MainDish;
  lunch_main_dish_vegetarian: MainDish;
  lunch_dessert: string;
  dinner_appetizer: string;
  dinner_main_dish_fish: MainDish;
  dinner_main_dish_meat: MainDish;
  dinner_main_dish_vegetarian: MainDish;
  dinner_dessert: string;
  allergens?: Record<string, string[]>;
  created_at?: string;
  updated_at?: string;
}

export type ConferenceMenuFormData = Omit<ConferenceMenu, 'id' | 'created_at' | 'updated_at'>;

const emptyDish = (type: MainDish['type']): MainDish => ({ id: '', name: '', description: '', type });

const parseMainDish = (dish: unknown, type: MainDish['type']): MainDish => {
  if (!dish) return emptyDish(type);
  if (typeof dish === 'string') {
    try { return { ...emptyDish(type), ...JSON.parse(dish) }; } catch { return emptyDish(type); }
  }
  return { ...emptyDish(type), ...(dish as MainDish) };
};

const hydrate = (m: any): ConferenceMenu => ({
  ...m,
  lunch_main_dish_fish: parseMainDish(m.lunch_main_dish_fish, 'fish'),
  lunch_main_dish_meat: parseMainDish(m.lunch_main_dish_meat, 'meat'),
  lunch_main_dish_vegetarian: parseMainDish(m.lunch_main_dish_vegetarian, 'vegetarian'),
  dinner_main_dish_fish: parseMainDish(m.dinner_main_dish_fish, 'fish'),
  dinner_main_dish_meat: parseMainDish(m.dinner_main_dish_meat, 'meat'),
  dinner_main_dish_vegetarian: parseMainDish(m.dinner_main_dish_vegetarian, 'vegetarian'),
  allergens: (m.allergens && typeof m.allergens === 'object') ? m.allergens as Record<string, string[]> : {},
});

export async function fetchMenus(): Promise<ConferenceMenu[]> {
  const { data, error } = await supabase.from('conference_menus').select('*').order('menu_date');
  if (error) throw error;
  return (data || []).map(hydrate);
}

export async function fetchMenuByDate(date: string): Promise<ConferenceMenu | null> {
  const { data, error } = await supabase.from('conference_menus').select('*').eq('menu_date', date).maybeSingle();
  if (error) throw error;
  return data ? hydrate(data) : null;
}

export async function saveMenu(menu: ConferenceMenuFormData): Promise<ConferenceMenu> {
  const fmt = (d: MainDish, t: MainDish['type']) => ({
    id: d?.id || '', name: d?.name || '', description: d?.description || '', type: d?.type || t,
  });
  const payload = {
    menu_date: menu.menu_date,
    lunch_appetizer: menu.lunch_appetizer || '',
    lunch_main_dish_fish: fmt(menu.lunch_main_dish_fish, 'fish'),
    lunch_main_dish_meat: fmt(menu.lunch_main_dish_meat, 'meat'),
    lunch_main_dish_vegetarian: fmt(menu.lunch_main_dish_vegetarian, 'vegetarian'),
    lunch_dessert: menu.lunch_dessert || '',
    dinner_appetizer: menu.dinner_appetizer || '',
    dinner_main_dish_fish: fmt(menu.dinner_main_dish_fish, 'fish'),
    dinner_main_dish_meat: fmt(menu.dinner_main_dish_meat, 'meat'),
    dinner_main_dish_vegetarian: fmt(menu.dinner_main_dish_vegetarian, 'vegetarian'),
    dinner_dessert: menu.dinner_dessert || '',
    allergens: (menu.allergens && typeof menu.allergens === 'object' ? menu.allergens : {}) as never,
  };
  const { data, error } = await supabase
    .from('conference_menus')
    .upsert(payload, { onConflict: 'menu_date' })
    .select()
    .single();
  if (error) throw error;
  return hydrate(data);
}

export async function deleteMenu(id: string): Promise<void> {
  const { error } = await supabase.from('conference_menus').delete().eq('id', id);
  if (error) throw error;
}

export async function generateMenusWithAI(req: { dateFrom: string; dateTo: string; prompt: string }) {
  const { data, error } = await supabase.functions.invoke('generate-conference-menus', { body: req });
  if (error) throw error;
  return data;
}

export async function regenerateDailyAssets(menuId: string) {
  const { data, error } = await supabase.functions.invoke('auto-menu-assets', {
    body: { menu_id: menuId, regenerate: true },
  });
  if (error) throw error;
  return data;
}

export async function regenerateDishImage(menuId: string, imageType: string) {
  const { data, error } = await supabase.functions.invoke('auto-menu-assets', {
    body: { menu_id: menuId, regenerate: true, only_types: [imageType], skip_pdf: true },
  });
  if (error) throw error;
  return data;
}

export async function fetchMenuImages(menuId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('conference_menu_images')
    .select('image_type, image_url, created_at')
    .eq('menu_id', menuId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of (data || []) as Array<{ image_type: string; image_url: string }>) {
    if (!map[row.image_type]) map[row.image_type] = row.image_url;
  }
  return map;
}

