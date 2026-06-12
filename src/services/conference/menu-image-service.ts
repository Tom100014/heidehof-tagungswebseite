// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface MenuImage {
  id: string;
  menu_id: string;
  image_url: string;
  image_type: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Lädt alle aktiven Bilder für ein bestimmtes Menü
 */
export async function fetchActiveMenuImages(menuId: string): Promise<MenuImage[]> {
  try {
    const { data, error } = await supabase
      .from('conference_menu_images')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active menu images:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch active menu images:', error);
    throw error;
  }
}

/**
 * Lädt das erste aktive Bild für einen bestimmten Bildtyp
 */
export async function fetchActiveImageByType(menuId: string, imageType: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conference_menu_images')
      .select('image_url')
      .eq('menu_id', menuId)
      .eq('image_type', imageType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active image by type:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0].image_url : null;
  } catch (error) {
    console.error('Failed to fetch active image by type:', error);
    return null;
  }
}

/**
 * Lädt alle aktiven Bilder organisiert nach Bildtyp
 */
export async function fetchActiveImagesByType(menuId: string): Promise<Record<string, string>> {
  try {
    const images = await fetchActiveMenuImages(menuId);
    const imageMap: Record<string, string> = {};

    // Nimm das erste (neueste) Bild für jeden Typ
    images.forEach(image => {
      if (!imageMap[image.image_type]) {
        imageMap[image.image_type] = image.image_url;
      }
    });

    return imageMap;
  } catch (error) {
    console.error('Failed to fetch active images by type:', error);
    return {};
  }
}