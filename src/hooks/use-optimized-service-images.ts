// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Persistent cache using localStorage
const CACHE_KEY = 'service_images_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface ServiceImagesCache {
  timestamp: number;
  images: ServiceImages;
}

interface ServiceImages {
  'beauty-treatments'?: string;
  'bar-max'?: string;
  'table-reservation'?: string;
  'shop'?: string;
  'conference-video'?: string;
  'petit-chef'?: string;
  'green-options'?: string;
}

export const useOptimizedServiceImages = () => {
  const [serviceImages, setServiceImages] = useState<ServiceImages>({});

  // Load from cache first
  const loadFromCache = (): ServiceImages | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: ServiceImagesCache = JSON.parse(cached);
      const now = Date.now();
      
      if (now - parsedCache.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache.images;
    } catch (error) {
      console.warn('Error loading cached service images:', error);
      return null;
    }
  };

  // Save to cache
  const saveToCache = (images: ServiceImages) => {
    try {
      const cacheData: ServiceImagesCache = {
        timestamp: Date.now(),
        images
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error saving service images to cache:', error);
    }
  };

  // Extract URL from settings value
  const extractUrl = (settingValue: any): string | null => {
    if (!settingValue) return null;
    if (typeof settingValue === 'string') return settingValue;
    if (typeof settingValue === 'object' && 'url' in settingValue) {
      return settingValue.url as string;
    }
    return null;
  };

  // Optimized batch loading
  const loadServiceImages = async () => {
    try {
      // Single query for all settings
      const { data: settings, error } = await supabase
        .from('hotel_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'beauty_treatments_service_image',
          'beauty_treatment_main_image',
          'bar_max_service_image',
          'table_reservation_service_image',
          'shop_main_image',
          'conference_service_image',
          'petit_chef_service_image',
          'green_options_service_image'
        ]);

      if (error) {
        console.warn('Error loading service settings:', error);
        return;
      }

      // Convert to lookup map
      const settingsMap: Record<string, any> = {};
      settings?.forEach(item => {
        settingsMap[item.setting_key] = item.setting_value;
      });

      // Extract service images with fallback hierarchy
      const newImages: ServiceImages = {
        'beauty-treatments': extractUrl(settingsMap.beauty_treatments_service_image) || 
                            extractUrl(settingsMap.beauty_treatment_main_image),
        'bar-max': extractUrl(settingsMap.bar_max_service_image),
        'table-reservation': extractUrl(settingsMap.table_reservation_service_image),
        'shop': extractUrl(settingsMap.shop_main_image),
        'conference-video': extractUrl(settingsMap.conference_service_image),
        'petit-chef': extractUrl(settingsMap.petit_chef_service_image),
        'green-options': extractUrl(settingsMap.green_options_service_image)
      };

      // Filter out null values
      const filteredImages = Object.fromEntries(
        Object.entries(newImages).filter(([_, value]) => value !== null)
      );

      setServiceImages(filteredImages);
      saveToCache(filteredImages);

      console.log('✅ Service images loaded and cached');
    } catch (error) {
      console.error('Error loading service images:', error);
    }
  };

  useEffect(() => {
    // Try cache first
    const cachedImages = loadFromCache();
    if (cachedImages) {
      setServiceImages(cachedImages);
      console.log('📦 Loaded service images from cache');
    }

    // Load fresh data in background (even if cached)
    loadServiceImages();
  }, []);

  return serviceImages;
};