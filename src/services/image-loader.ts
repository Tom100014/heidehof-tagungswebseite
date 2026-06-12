// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { resourcePreloader } from '@/services/bundle-optimization/resource-preloader';

// Cache für geladene Bilder
const imageCache = new Map<string, string>();

// Interface für Service-Bilder
interface ServiceImages {
  beautyImage: string;
  barMaxImage: string;
  restaurantImage: string;
  tableReservationImage: string;
  shopImage: string;
  conferenceImage: string;
  petitChefImage: string;
  greenOptionsImage: string;
}

// Fallback-Bilder
const FALLBACK_IMAGES = {
  beauty: "/lovable-uploads/3aa99872-560d-4b79-8a3f-48350eac479a.jpg",
  barMax: "/lovable-uploads/3aa99872-560d-4b79-8a3f-48350eac479a.jpg",
  restaurant: "/lovable-uploads/3aa99872-560d-4b79-8a3f-48350eac479a.jpg",
  tableReservation: "/lovable-uploads/3aa99872-560d-4b79-8a3f-48350eac479a.jpg",
  shop: "/lovable-uploads/3aa99872-560d-4b79-8a3f-48350eac479a.jpg",
  conference: "/lovable-uploads/494ae953-00ae-442b-9333-051edb799d04.png",
  petitChef: "/lovable-uploads/ef5cc1a7-3c63-41e5-8161-e8f033b7e327.png",
  greenOptions: "/lovable-uploads/99b3cb6c-72e1-40cd-8669-d3b61ba83232.png"
};

// Optimierte Klasse zum Laden aller Service-Bilder
export class ServiceImageLoader {
  private static instance: ServiceImageLoader;
  
  static getInstance(): ServiceImageLoader {
    if (!ServiceImageLoader.instance) {
      ServiceImageLoader.instance = new ServiceImageLoader();
    }
    return ServiceImageLoader.instance;
  }

  // Batch-Ladung aller hotel_settings
  private async loadAllHotelSettings(): Promise<Record<string, any>> {
    const settingKeys = [
      'beauty_treatments_service_image',
      'beauty_treatment_main_image', 
      'bar_max_service_image',
      'restaurant_maxwell_service_image',
      'table_reservation_service_image',
      'shop_main_image',
      'conference_service_image',
      'conference-video',
      'petit_chef_service_image',
      'green_options_service_image'
    ];

    try {
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('setting_key, setting_value')
        .in('setting_key', settingKeys);

      if (error) {
        console.warn('Fehler beim Laden der hotel_settings:', error);
        return {};
      }

      const settings: Record<string, any> = {};
      data?.forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Fehler beim Batch-Laden der Einstellungen:', error);
      return {};
    }
  }

  // Parallel-Ladung aller Item-Bilder
  private async loadAllItemImages(): Promise<Record<string, string[]>> {
    const itemImages: Record<string, string[]> = {};

    try {
      // Beauty treatment images
      const { data: beautyData } = await supabase
        .from('beauty_treatment_images')
        .select('image_url')
        .limit(1);
      itemImages.beauty = beautyData?.map(item => item.image_url) || [];
    } catch (error) {
      console.warn('Fehler beim Laden von beauty_treatment_images:', error);
      itemImages.beauty = [];
    }

    try {
      // Bar max item images
      const { data: barData } = await supabase
        .from('bar_max_item_images')
        .select('image_url')
        .limit(1);
      itemImages.barMax = barData?.map(item => item.image_url) || [];
    } catch (error) {
      console.warn('Fehler beim Laden von bar_max_item_images:', error);
      itemImages.barMax = [];
    }

    try {
      // Restaurant item images
      const { data: restaurantData } = await supabase
        .from('restaurant_item_images')
        .select('image_url')
        .limit(1);
      itemImages.restaurant = restaurantData?.map(item => item.image_url) || [];
    } catch (error) {
      console.warn('Fehler beim Laden von restaurant_item_images:', error);
      itemImages.restaurant = [];
    }

    try {
      // Product images
      const { data: productData } = await supabase
        .from('product_images')
        .select('image_url')
        .limit(1);
      itemImages.shop = productData?.map(item => item.image_url) || [];
    } catch (error) {
      console.warn('Fehler beim Laden von product_images:', error);
      itemImages.shop = [];
    }

    return itemImages;
  }

  // Extrahiert URL aus setting_value Objekt
  private extractUrl(settingValue: any): string | null {
    if (!settingValue) return null;
    
    if (typeof settingValue === 'string') {
      return settingValue;
    }
    
    if (typeof settingValue === 'object' && 'url' in settingValue) {
      return settingValue.url as string;
    }
    
    return null;
  }

  // Preload Bilder mit ResourcePreloader
  private async preloadImages(images: string[]): Promise<void> {
    const preloader = resourcePreloader;
    const preloadPromises = images
      .filter(url => url && !imageCache.has(url))
      .map(async (url) => {
        try {
          await preloader.preloadImage(url);
          imageCache.set(url, url);
        } catch (error) {
          console.warn(`Fehler beim Preloading von ${url}:`, error);
        }
      });

    await Promise.allSettled(preloadPromises);
  }

  // Hauptfunktion zum Laden aller Service-Bilder
  async loadAllServiceImages(): Promise<ServiceImages> {
    const startTime = performance.now();
    
    try {
      // Parallel: Settings und Item-Bilder laden
      const [settings, itemImages] = await Promise.all([
        this.loadAllHotelSettings(),
        this.loadAllItemImages()
      ]);

      // Service-Bilder ermitteln
      const serviceImages: ServiceImages = {
        beautyImage: this.extractUrl(settings.beauty_treatments_service_image) ||
                    this.extractUrl(settings.beauty_treatment_main_image) ||
                    itemImages.beauty?.[0] ||
                    FALLBACK_IMAGES.beauty,

        barMaxImage: this.extractUrl(settings.bar_max_service_image) ||
                    itemImages.barMax?.[0] ||
                    FALLBACK_IMAGES.barMax,

        restaurantImage: this.extractUrl(settings.restaurant_maxwell_service_image) ||
                        itemImages.restaurant?.[0] ||
                        FALLBACK_IMAGES.restaurant,

        tableReservationImage: this.extractUrl(settings.table_reservation_service_image) ||
                              FALLBACK_IMAGES.tableReservation,

        shopImage: this.extractUrl(settings.shop_main_image) ||
                  itemImages.shop?.[0] ||
                  FALLBACK_IMAGES.shop,

        conferenceImage: this.extractUrl(settings.conference_service_image) ||
                        this.extractUrl(settings['conference-video']) ||
                        FALLBACK_IMAGES.conference,

        petitChefImage: this.extractUrl(settings.petit_chef_service_image) ||
                       FALLBACK_IMAGES.petitChef,

        greenOptionsImage: this.extractUrl(settings.green_options_service_image) ||
                          FALLBACK_IMAGES.greenOptions
      };

      // Alle Bilder preloaden
      const allImages = Object.values(serviceImages).filter(Boolean);
      await this.preloadImages(allImages);

      const loadTime = performance.now() - startTime;
      console.log(`✅ Alle Service-Bilder geladen in ${loadTime.toFixed(2)}ms`);

      return serviceImages;
    } catch (error) {
      console.error('Fehler beim Laden der Service-Bilder:', error);
      
      // Fallback: Alle Fallback-Bilder verwenden
      return {
        beautyImage: FALLBACK_IMAGES.beauty,
        barMaxImage: FALLBACK_IMAGES.barMax,
        restaurantImage: FALLBACK_IMAGES.restaurant,
        tableReservationImage: FALLBACK_IMAGES.tableReservation,
        shopImage: FALLBACK_IMAGES.shop,
        conferenceImage: FALLBACK_IMAGES.conference,
        petitChefImage: FALLBACK_IMAGES.petitChef,
        greenOptionsImage: FALLBACK_IMAGES.greenOptions
      };
    }
  }

  // Cache leeren (für Testing/Development)
  clearCache(): void {
    imageCache.clear();
  }
}

export const serviceImageLoader = ServiceImageLoader.getInstance();