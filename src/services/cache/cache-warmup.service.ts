// @ts-nocheck

import { enhancedCacheStrategy } from './enhanced-cache-strategy';
import { supabase } from '@/integrations/supabase/client';

interface WarmupConfig {
  backgroundImage: boolean;
  menuData: boolean;
  treatmentData: boolean;
  settingsData: boolean;
}

class CacheWarmupService {
  private isWarming = false;

  async warmupCriticalData(config: WarmupConfig = {
    backgroundImage: true,
    menuData: true,
    treatmentData: true,
    settingsData: true
  }) {
    if (this.isWarming) {
      console.log('Cache warmup already in progress');
      return;
    }

    this.isWarming = true;
    console.log('🔥 Starting cache warmup...');

    try {
      const warmupPromises: Promise<void>[] = [];

      if (config.backgroundImage) {
        warmupPromises.push(this.warmupBackgroundImage());
      }

      if (config.menuData) {
        warmupPromises.push(this.warmupMenuData());
      }

      if (config.treatmentData) {
        warmupPromises.push(this.warmupTreatmentData());
      }

      if (config.settingsData) {
        warmupPromises.push(this.warmupSettingsData());
      }

      await Promise.allSettled(warmupPromises);
      console.log('✅ Cache warmup completed');

    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    } finally {
      this.isWarming = false;
    }
  }

  private async warmupBackgroundImage(): Promise<void> {
    try {
      const { data } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'default_background_image')
        .single();

      if (data?.setting_value && typeof data.setting_value === 'object' && 'url' in data.setting_value) {
        const imageUrl = (data.setting_value as { url: string }).url;
        
        enhancedCacheStrategy.set('homepage-background-image-url', imageUrl, {
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: ['media', 'background'],
          dependencies: ['hotel_settings']
        });

        console.log('🖼️ Background image cached');
      }
    } catch (error) {
      console.warn('Background image warmup failed:', error);
    }
  }

  private async warmupMenuData(): Promise<void> {
    try {
      // Bar Max Menu
      const { data: barMaxData } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'bar_max_additional_items')
        .single();

      if (barMaxData?.setting_value) {
        enhancedCacheStrategy.set('bar_max_additional_items', barMaxData.setting_value, {
          ttl: 15 * 60 * 1000, // 15 minutes
          tags: ['menu', 'bar_max'],
          dependencies: ['hotel_settings']
        });
      }

      // Restaurant Maxwell Menu
      const { data: restaurantData } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'restaurant_maxwell_items')
        .single();

      if (restaurantData?.setting_value) {
        enhancedCacheStrategy.set('restaurant_maxwell_items', restaurantData.setting_value, {
          ttl: 15 * 60 * 1000, // 15 minutes
          tags: ['menu', 'restaurant'],
          dependencies: ['hotel_settings']
        });
      }

      console.log('🍽️ Menu data cached');
    } catch (error) {
      console.warn('Menu data warmup failed:', error);
    }
  }

  private async warmupTreatmentData(): Promise<void> {
    try {
      const { data } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'beauty_treatments')
        .single();

      if (data?.setting_value) {
        enhancedCacheStrategy.set('beauty_treatments', data.setting_value, {
          ttl: 20 * 60 * 1000, // 20 minutes
          tags: ['beauty', 'treatments'],
          dependencies: ['hotel_settings']
        });

        console.log('💆 Treatment data cached');
      }
    } catch (error) {
      console.warn('Treatment data warmup failed:', error);
    }
  }

  private async warmupSettingsData(): Promise<void> {
    try {
      const { data } = await supabase
        .from('hotel_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'welcome_video_url',
          'hotel_contact_info',
          'opening_hours',
          'video_buttons_config'
        ]);

      if (data) {
        data.forEach(setting => {
          enhancedCacheStrategy.set(`setting_${setting.setting_key}`, setting.setting_value, {
            ttl: 60 * 60 * 1000, // 1 hour
            tags: ['settings'],
            dependencies: ['hotel_settings']
          });
        });

        console.log('⚙️ Settings data cached');
      }
    } catch (error) {
      console.warn('Settings data warmup failed:', error);
    }
  }

  getWarmupStatus(): { isWarming: boolean } {
    return { isWarming: this.isWarming };
  }
}

export const cacheWarmupService = new CacheWarmupService();
