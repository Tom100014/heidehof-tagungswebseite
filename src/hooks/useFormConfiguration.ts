// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FormConfigurationFields {
  sms_enabled: boolean;
  target_number: string;
  email_enabled: boolean;
  target_email: string;
  emailjs_enabled: boolean;
}

export interface FormConfiguration {
  id: string;
  name: string;
  category: string;
  description: string | null;
  fields: FormConfigurationFields;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useFormConfiguration = (formId: string) => {
  const [configuration, setConfiguration] = useState<FormConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('form_configurations')
          .select('*')
          .eq('id', formId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setConfiguration({
            ...data,
            fields: (data.fields as unknown) as FormConfigurationFields
          });
        }
      } catch (error) {
        console.error('Error fetching form configuration:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchConfiguration();
    }
  }, [formId]);

  return { configuration, loading, error };
};

export const useAllFormConfigurations = () => {
  const [configurations, setConfigurations] = useState<FormConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('form_configurations')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;

        const formattedData = (data || []).map(item => ({
          ...item,
          fields: (item.fields as unknown) as FormConfigurationFields
        }));

        setConfigurations(formattedData);
      } catch (error) {
        console.error('Error fetching form configurations:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, []);

  const refreshConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('form_configurations')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        fields: (item.fields as unknown) as FormConfigurationFields
      }));

      setConfigurations(formattedData);
    } catch (error) {
      console.error('Error fetching form configurations:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { configurations, loading, error, refreshConfigurations };
};