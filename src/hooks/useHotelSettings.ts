// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NumberRange {
  from: number;
  to: number;
}

interface NumberConfig {
  ranges: NumberRange[];
  individual: number[];
}

interface HotelSettings {
  valid_room_numbers: NumberConfig;
  valid_key_numbers: NumberConfig;
}

export const useHotelSettings = () => {
  const [settings, setSettings] = useState<HotelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['valid_room_numbers', 'valid_key_numbers']);

      if (error) throw error;

      const settingsObj: Partial<HotelSettings> = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key as keyof HotelSettings] = setting.setting_value as unknown as NumberConfig;
      });

      setSettings(settingsObj as HotelSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const isValidNumber = (value: string, type: 'room' | 'key'): boolean => {
    if (!settings) return true; // Allow if settings not loaded
    
    const num = parseInt(value);
    if (isNaN(num)) return false;

    const config = type === 'room' ? settings.valid_room_numbers : settings.valid_key_numbers;
    
    // Check individual numbers
    if (config.individual.includes(num)) return true;
    
    // Check ranges
    return config.ranges.some(range => num >= range.from && num <= range.to);
  };

  const getValidNumbers = (type: 'room' | 'key'): number[] => {
    if (!settings) return [];
    
    const config = type === 'room' ? settings.valid_room_numbers : settings.valid_key_numbers;
    const numbers: number[] = [...config.individual];
    
    config.ranges.forEach(range => {
      for (let i = range.from; i <= range.to; i++) {
        if (!numbers.includes(i)) numbers.push(i);
      }
    });
    
    return numbers.sort((a, b) => a - b);
  };

  const getSuggestions = (type: 'room' | 'key', input: string): string[] => {
    const validNumbers = getValidNumbers(type);
    const inputNum = parseInt(input);
    
    if (input.length === 0) {
      return validNumbers.slice(0, 5).map(n => n.toString().padStart(3, '0'));
    }
    
    return validNumbers
      .filter(num => num.toString().startsWith(input))
      .slice(0, 8)
      .map(n => n.toString().padStart(3, '0'));
  };

  return {
    settings,
    loading,
    error,
    isValidNumber,
    getValidNumbers,
    getSuggestions,
    refetch: fetchSettings
  };
};