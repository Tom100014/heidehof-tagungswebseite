// @ts-nocheck

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/types/order";

export const useAdminRequests = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<Order[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [beautyAppointments, setBeautyAppointments] = useState<any[]>([]);
  const [conferenceOrders, setConferenceOrders] = useState<any[]>([]);
  const [barMaxReservations, setBarMaxReservations] = useState<any[]>([]);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);

  const fetchRequests = async () => {
    setIsLoading(true);
    console.log('🔄 useAdminRequests: Starte vollständige Datenabfrage...');
    
    try {
      // 1. Room Service Orders (orders + order_items)
      console.log('📋 useAdminRequests: Lade Room Service Orders...');
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('❌ useAdminRequests Orders Error:', ordersError);
      } else {
        console.log(`✅ useAdminRequests: ${ordersData?.length || 0} Room Service Orders geladen`);
        
        if (ordersData && ordersData.length > 0) {
          const orderIds = ordersData.map(order => order.id);
          
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);
          
          if (itemsError) {
            console.error('❌ useAdminRequests Order Items Error:', itemsError);
          }
          
          const processedOrders = ordersData.map(order => {
            const orderItems = (itemsData || [])
              .filter(item => item.order_id === order.id)
              .map(item => ({
                id: item.menu_item_id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes
              }));
              
            return {
              ...order,
              items: orderItems,
              department: 'room_service',
              timestamp: order.created_at
            } as Order;
          });
          
          setRequests(processedOrders);
        }
      }
      
      // 2. Restaurant Orders (restaurant_orders)
      console.log('🍽️ useAdminRequests: Lade Restaurant Orders...');
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (restaurantError) {
        console.error('❌ useAdminRequests Restaurant Orders Error:', restaurantError);
        setRestaurantOrders([]);
      } else {
        console.log(`✅ useAdminRequests: ${restaurantData?.length || 0} Restaurant Orders geladen`);
        setRestaurantOrders(restaurantData || []);
      }
      
      // 3. Beauty Appointments
      console.log('💅 useAdminRequests: Lade Beauty Appointments...');
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (appointmentError) {
        console.error('❌ useAdminRequests Beauty Appointments Error:', appointmentError);
        setBeautyAppointments([]);
      } else {
        console.log(`✅ useAdminRequests: ${appointmentData?.length || 0} Beauty Appointments geladen`);
        setBeautyAppointments(appointmentData || []);
      }

      // 4. Conference Orders - VERBESSERTE IMPLEMENTIERUNG
      console.log('🏢 useAdminRequests: Lade Conference Orders...');
      const { data: conferenceData, error: conferenceError } = await supabase
        .from('conference_orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (conferenceError) {
        console.error('❌ useAdminRequests Conference Orders Error:', conferenceError);
        console.error('❌ Conference Orders Error Details:', {
          message: conferenceError.message,
          details: conferenceError.details,
          hint: conferenceError.hint,
          code: conferenceError.code
        });
        setConferenceOrders([]);
        
        // Zeige eine spezifische Fehlermeldung für Conference Orders
        toast({
          title: "Warnung: Tagungsmenüs",
          description: `Tagungsmenü-Bestellungen konnten nicht geladen werden: ${conferenceError.message}`,
          variant: "destructive"
        });
      } else {
        console.log(`✅ useAdminRequests: ${conferenceData?.length || 0} Conference Orders geladen`);
        console.log('🏢 Conference Orders Data Sample:', conferenceData?.slice(0, 2));
        
        // Validiere Conference Order Struktur
        if (conferenceData && conferenceData.length > 0) {
          const validOrders = conferenceData.filter(order => {
            const isValid = order.id && order.guest_info && order.order_date;
            if (!isValid) {
              console.warn('⚠️ Ungültige Conference Order gefunden:', order);
            }
            return isValid;
          });
          
          console.log(`✅ ${validOrders.length} von ${conferenceData.length} Conference Orders sind gültig`);
          setConferenceOrders(validOrders);
        } else {
          setConferenceOrders([]);
        }
      }

      // 5. Bar Max Reservations (SEPARATE TABELLE)
      console.log('🍷 useAdminRequests: Lade Bar Max Reservations...');
      const { data: barMaxData, error: barMaxError } = await supabase
        .from('bar_max_reservations')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (barMaxError) {
        console.error('❌ useAdminRequests Bar Max Reservations Error:', barMaxError);
        setBarMaxReservations([]);
      } else {
        console.log(`✅ useAdminRequests: ${barMaxData?.length || 0} Bar Max Reservations geladen`);
        setBarMaxReservations(barMaxData || []);
      }

      // 6. Contact Requests
      console.log('📞 useAdminRequests: Lade Contact Requests...');
      const { data: contactData, error: contactError } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (contactError) {
        console.error('❌ useAdminRequests Contact Requests Error:', contactError);
        setContactRequests([]);
      } else {
        console.log(`✅ useAdminRequests: ${contactData?.length || 0} Contact Requests geladen`);
        setContactRequests(contactData || []);
      }

      // 7. Shop Orders
      console.log('🛍️ useAdminRequests: Lade Shop Orders...');
      const { data: shopData, error: shopError } = await supabase
        .from('shop_orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shopError) {
        console.error('❌ useAdminRequests Shop Orders Error:', shopError);
        setShopOrders([]);
      } else {
        console.log(`✅ useAdminRequests: ${shopData?.length || 0} Shop Orders geladen`);
        setShopOrders(shopData || []);
      }

      // ZUSÄTZLICH: Prüfe auch Maxwell Orders (falls vorhanden)
      console.log('🏨 useAdminRequests: Lade Maxwell Orders...');
      const { data: maxwellData, error: maxwellError } = await supabase
        .from('maxwell_orders')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (maxwellError) {
        console.warn('⚠️ useAdminRequests: Maxwell Orders Tabelle nicht verfügbar:', maxwellError);
      } else if (maxwellData && maxwellData.length > 0) {
        console.log(`✅ useAdminRequests: ${maxwellData.length} Maxwell Orders gefunden - füge zu Restaurant Orders hinzu`);
        // Füge Maxwell Orders zu Restaurant Orders hinzu
        setRestaurantOrders(prev => [...prev, ...maxwellData]);
      }
      
      // Teste direkt die Verbindung zur Conference Orders Tabelle
      console.log('🔍 useAdminRequests: Teste Conference Orders Tabellen-Zugriff...');
      const { count, error: countError } = await supabase
        .from('conference_orders')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('❌ Conference Orders Tabellen-Zugriff fehlgeschlagen:', countError);
      } else {
        console.log(`✅ Conference Orders Tabelle zugänglich - Total Count: ${count}`);
      }
      
      console.log('🎉 useAdminRequests: Alle Datenabfragen abgeschlossen!');
      
    } catch (error) {
      console.error("💥 useAdminRequests: Kritischer Fehler beim Laden der Bestellungen:", error);
      toast({
        title: "Kritischer Fehler",
        description: "Die Bestellungen konnten nicht geladen werden. Bitte prüfen Sie die Datenbankverbindung.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    requests,
    restaurantOrders,
    beautyAppointments,
    conferenceOrders,
    barMaxReservations,
    contactRequests,
    shopOrders,
    fetchRequests,
    setRequests,
    setRestaurantOrders,
    setBeautyAppointments,
    setConferenceOrders,
    setBarMaxReservations,
    setContactRequests,
    setShopOrders
  };
};
