// @ts-nocheck

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { adminSecurity } from '@/utils/admin-security';

export const useAdminRequests = () => {
  const fetchAllRequests = async () => {
    console.log('🔄 Lade alle Admin-Anfragen...');
    
    // Require admin access for all admin data
    await adminSecurity.requireAdmin();
    
    try {
      // Parallel alle Bestellungstypen laden
      const [
        { data: requests },
        { data: restaurantOrders },
        { data: beautyAppointments },
        { data: conferenceOrders },
        { data: barMaxReservations },
        { data: contactRequests },
        { data: shopOrders },
        { data: maxwellOrders },
        { data: restaurantReservations }
      ] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('restaurant_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('beauty_appointments').select('*').order('timestamp', { ascending: false }),
        supabase.from('conference_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('bar_max_reservations').select('*').order('timestamp', { ascending: false }),
        supabase.from('contact_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('maxwell_orders').select('*').order('timestamp', { ascending: false }),
        supabase.from('table_reservations').select('*').order('created_at', { ascending: false })
      ]);

      console.log('📊 Geladene Daten:', {
        requests: requests?.length || 0,
        restaurantOrders: restaurantOrders?.length || 0,
        beautyAppointments: beautyAppointments?.length || 0,
        conferenceOrders: conferenceOrders?.length || 0,
        barMaxReservations: barMaxReservations?.length || 0,
        contactRequests: contactRequests?.length || 0,
        shopOrders: shopOrders?.length || 0,
        maxwellOrders: maxwellOrders?.length || 0,
        restaurantReservations: restaurantReservations?.length || 0
      });

      // Log admin access for audit trail
      await adminSecurity.logAction({ action: 'VIEW_ALL_REQUESTS', entity: 'multiple_tables' });

      return {
        requests: requests || [],
        restaurantOrders: restaurantOrders || [],
        beautyAppointments: beautyAppointments || [],
        conferenceOrders: conferenceOrders || [],
        barMaxReservations: barMaxReservations || [],
        contactRequests: contactRequests || [],
        shopOrders: shopOrders || [],
        maxwellOrders: maxwellOrders || [],
        restaurantReservations: restaurantReservations || []
      };
    } catch (error) {
      console.error('❌ Fehler beim Laden der Admin-Anfragen:', error);
      toast.error('Admin-Zugriff erforderlich oder Fehler beim Laden');
      return {
        requests: [],
        restaurantOrders: [],
        beautyAppointments: [],
        conferenceOrders: [],
        barMaxReservations: [],
        contactRequests: [],
        shopOrders: [],
        maxwellOrders: [],
        restaurantReservations: []
      };
    }
  };

  const {
    data,
    isLoading,
    error,
    refetch: fetchRequests
  } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: fetchAllRequests,
    // Poll only every 2 minutes; pause when tab is hidden to save network/CPU.
    refetchInterval: () => (document.visibilityState === 'visible' ? 120000 : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  if (error) {
    console.error('❌ Admin requests query error:', error);
  }


  return {
    isLoading,
    error,
    fetchRequests,
    requests: data?.requests || [],
    restaurantOrders: data?.restaurantOrders || [],
    beautyAppointments: data?.beautyAppointments || [],
    conferenceOrders: data?.conferenceOrders || [],
    barMaxReservations: data?.barMaxReservations || [],
    contactRequests: data?.contactRequests || [],
    shopOrders: data?.shopOrders || [],
    maxwellOrders: data?.maxwellOrders || [],
    restaurantReservations: data?.restaurantReservations || []
  };
};
