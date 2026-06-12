// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  template_key: string;
  form_type: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'copy';
  language: string;
  name: string;
  content: string;
  variables?: Record<string, any>;
  is_active: boolean;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export const useMessageTemplates = () => {
  return useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('form_type', { ascending: true })
        .order('channel', { ascending: true });

      if (error) throw error;
      return data as MessageTemplate[];
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MessageTemplate> }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Templates');
      console.error('Template update error:', error);
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([template as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen des Templates');
      console.error('Template create error:', error);
    },
  });
};

export const useHotelFooter = () => {
  return useQuery({
    queryKey: ['hotel-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'message_footer')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value || '';
    },
  });
};

export const useUpdateHotelFooter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (footerContent: string) => {
      const { data, error } = await supabase
        .from('hotel_settings')
        .upsert({
          setting_key: 'message_footer',
          setting_value: footerContent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-footer'] });
      toast.success('Hotel-Footer erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Footers');
      console.error('Footer update error:', error);
    },
  });
};

export const usePromotionalFooter = () => {
  return useQuery({
    queryKey: ['promotional-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', 'promotional_footer')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value || '';
    },
  });
};

export const useUpdatePromotionalFooter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (footerContent: string) => {
      const { data, error } = await supabase
        .from('hotel_settings')
        .upsert({
          setting_key: 'promotional_footer',
          setting_value: footerContent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-footer'] });
      toast.success('Werbung erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Werbung');
      console.error('Promotional footer update error:', error);
    },
  });
};
