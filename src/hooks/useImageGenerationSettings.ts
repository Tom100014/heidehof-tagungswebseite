// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImageGenerationProvider {
  id: string;
  provider: string;
  is_active: boolean;
  priority: number;
  display_name: string;
  description: string;
}

export const useImageGenerationSettings = () => {
  const [providers, setProviders] = useState<ImageGenerationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('image_generation_settings')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      setProviders(data as any || []);
      
      // Aktive Provider nach Priorität sortiert
      const active = (data || [])
        .filter((p: any) => p.is_active)
        .sort((a: any, b: any) => a.priority - b.priority)
        .map((p: any) => p.provider);
      
      setActiveProviders(active);
    } catch (error) {
      console.error('Fehler beim Laden der Bildgenerierungs-Einstellungen:', error);
      toast.error('Einstellungen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProvider = async (provider: string, updates: Partial<ImageGenerationProvider>) => {
    try {
      const { error } = await supabase
        .from('image_generation_settings')
        .update(updates)
        .eq('provider', provider);

      if (error) throw error;

      toast.success('Einstellung gespeichert');
      await fetchSettings();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      toast.error('Einstellung konnte nicht gespeichert werden');
    }
  };

  const toggleProvider = async (provider: string, isActive: boolean) => {
    await updateProvider(provider, { is_active: isActive });
  };

  const updatePriority = async (provider: string, priority: number) => {
    await updateProvider(provider, { priority });
  };

  const movePriorityUp = async (provider: string) => {
    const currentProvider = providers.find(p => p.provider === provider);
    if (!currentProvider) return;

    // Find provider with priority one less
    const higherProvider = providers.find(p => p.priority === currentProvider.priority - 1);
    if (!higherProvider) return;

    // Swap priorities
    try {
      await supabase
        .from('image_generation_settings')
        .update({ priority: currentProvider.priority })
        .eq('provider', higherProvider.provider);

      await supabase
        .from('image_generation_settings')
        .update({ priority: higherProvider.priority })
        .eq('provider', currentProvider.provider);

      toast.success('Priorität aktualisiert');
      await fetchSettings();
    } catch (error) {
      console.error('Fehler beim Verschieben der Priorität:', error);
      toast.error('Priorität konnte nicht geändert werden');
    }
  };

  const movePriorityDown = async (provider: string) => {
    const currentProvider = providers.find(p => p.provider === provider);
    if (!currentProvider) return;

    // Find provider with priority one more
    const lowerProvider = providers.find(p => p.priority === currentProvider.priority + 1);
    if (!lowerProvider) return;

    // Swap priorities
    try {
      await supabase
        .from('image_generation_settings')
        .update({ priority: currentProvider.priority })
        .eq('provider', lowerProvider.provider);

      await supabase
        .from('image_generation_settings')
        .update({ priority: lowerProvider.priority })
        .eq('provider', currentProvider.provider);

      toast.success('Priorität aktualisiert');
      await fetchSettings();
    } catch (error) {
      console.error('Fehler beim Verschieben der Priorität:', error);
      toast.error('Priorität konnte nicht geändert werden');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    providers,
    activeProviders,
    isLoading,
    toggleProvider,
    updatePriority,
    movePriorityUp,
    movePriorityDown,
    refetch: fetchSettings
  };
};
