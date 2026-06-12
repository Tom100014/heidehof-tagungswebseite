// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerProfile {
  id: string;
  full_name: string;
  room_number: string | null;
  spa_key_number: string | null;
  phone_number: string | null;
  email: string | null;
  guest_type: 'hotel' | 'spa' | 'conference';
  check_in_date: string | null;
  check_out_date: string | null;
  intelligence_score: number;
  customer_category: 'vip' | 'power_user' | 'new' | 'risk' | 'regular';
  preferences: any;
  ai_insights: any;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string | null;
  favorite_services: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CustomerOrder {
  id: string;
  customer_name: string;
  room_number: string | null;
  order_source: string;
  category: string;
  total_amount: number;
  items: any;
  status: string;
  created_at: string;
  contact_method: string;
  contact_info: string;
  notes: string | null;
}

export const useCustomerProfiles = (filters?: {
  category?: string;
  search?: string;
  sortBy?: 'score' | 'spent' | 'orders' | 'recent';
}) => {
  return useQuery({
    queryKey: ['customer-profiles', filters],
    queryFn: async () => {
      let query = supabase
        .from('customer_profiles' as any)
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('customer_category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,room_number.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'score':
          query = query.order('intelligence_score', { ascending: false });
          break;
        case 'spent':
          query = query.order('total_spent', { ascending: false });
          break;
        case 'orders':
          query = query.order('total_orders', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('last_order_date', { ascending: false, nullsFirst: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching customer profiles:', error);
        throw error;
      }

      return data as any as CustomerProfile[];
    },
  });
};

export const useCustomerProfile = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_profiles' as any)
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        console.error('Error fetching customer profile:', error);
        throw error;
      }

      return data as any as CustomerProfile;
    },
    enabled: !!customerId,
  });
};

export const useCustomerOrders = (customerName: string) => {
  return useQuery({
    queryKey: ['customer-orders', customerName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_unified_orders' as any)
        .select('*')
        .eq('customer_name', customerName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
      }

      return data as any as CustomerOrder[];
    },
    enabled: !!customerName,
  });
};

export const useAnalyzeCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, customerName }: { customerId: string; customerName: string }) => {
      console.log('🤖 Starting AI analysis for customer:', customerId);

      // Fetch customer data
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles' as any)
        .select('*')
        .eq('id', customerId)
        .single();

      if (profileError) throw profileError;

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('customer_unified_orders' as any)
        .select('*')
        .eq('customer_name', customerName);

      if (ordersError) throw ordersError;

      // Call AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-customer-intelligence', {
        body: {
          customerId,
          orders,
          currentStats: {
            total_orders: (profile as any).total_orders,
            total_spent: (profile as any).total_spent,
            avg_order_value: (profile as any).avg_order_value,
          },
        },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('🤖 KI-Analyse abgeschlossen');
      queryClient.invalidateQueries({ queryKey: ['customer-profile', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-profiles'] });
    },
    onError: (error) => {
      console.error('AI analysis error:', error);
      toast.error('KI-Analyse fehlgeschlagen');
    },
  });
};

export const useUpdateCustomerPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, preferences }: { customerId: string; preferences: any }) => {
      const { data, error } = await supabase
        .from('customer_profiles' as any)
        .update({ preferences, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success('Präferenzen aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['customer-profile', data.id] });
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren');
    },
  });
};
