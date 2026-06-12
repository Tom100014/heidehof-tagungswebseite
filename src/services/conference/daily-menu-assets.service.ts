import { supabase } from "@/integrations/supabase/client";

export interface DailyMenuAsset {
  id: string;
  menu_id: string;
  menu_date: string;
  pdf_path: string | null;
  pdf_url: string | null;
  images: Record<string, string>;
  status: string;
  error_message?: string | null;
}

export async function getDailyMenuAssetByDate(date: string): Promise<DailyMenuAsset | null> {
  const { data, error } = await supabase
    .from('daily_menu_assets')
    .select('*')
    .eq('menu_date', date)
    .maybeSingle();
  if (error) { console.error(error); return null; }
  return data as unknown as DailyMenuAsset | null;
}

export async function getDailyMenuAssetByMenuId(menuId: string): Promise<DailyMenuAsset | null> {
  const { data, error } = await supabase
    .from('daily_menu_assets')
    .select('*')
    .eq('menu_id', menuId)
    .maybeSingle();
  if (error) { console.error(error); return null; }
  return data as unknown as DailyMenuAsset | null;
}
