// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoButton {
  id: string;
  name: string;
  icon_name: string;
  video_key: string;
  position: number;
  is_active: boolean;
}

export const useVideoButtons = () => {
  const [buttons, setButtons] = useState<VideoButton[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadButtons();
  }, []);

  const loadButtons = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('video_buttons')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      setButtons(data || []);
    } catch (err) {
      console.error('Error loading video buttons:', err);
      setError('Buttons konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  return { buttons, isLoading, error, refetch: loadButtons };
};
