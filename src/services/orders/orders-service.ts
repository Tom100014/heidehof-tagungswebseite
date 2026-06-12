// @ts-nocheck

import { BaseAPIService } from "../api/base-api.service";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cacheService } from '@/services/cache/cache-service';
import { Order } from '@/types/order';

export class OrdersService extends BaseAPIService {
  private CACHE_KEY_RECENT_ORDERS = 'recent-orders';
  private CACHE_TTL = 1 * 60 * 1000; // 1 minute cache time
  
  async createOrder(orderData: any): Promise<{ success: boolean; orderId?: string; error?: Error }> {
    const response = await this.executeRequest<{ orderId: string }>(
      'store-order',
      'invoke',
      orderData,
      {
        showToast: true,
        customSuccessMessage: 'Order processed successfully',
        customErrorMessage: 'Error processing order'
      }
    );
    
    return {
      success: !response.error,
      orderId: response.data?.orderId,
      error: response.error || undefined
    };
  }

  async getRecentOrders(limit: number = 20): Promise<Order[]> {
    try {
      console.log('🔄 OrdersService: Lade alle Bestellungen...');
      cacheService.invalidate(this.CACHE_KEY_RECENT_ORDERS);
      
      const [
        restaurantOrders, 
        beautyAppointments, 
        maxwellOrders, 
        barMaxReservations,
        conferenceOrders,
        contactRequests,
        adminMessages,
        restaurantBarOrders
      ] = await Promise.all([
        this.getRestaurantOrders(limit),
        this.getBeautyAppointments(limit),
        this.getMaxwellOrders(limit),
        this.getBarMaxReservations(limit),
        this.getConferenceOrders(limit),
        this.getContactRequests(limit),
        this.getAdminMessages(limit),
        this.getRestaurantBarOrders(limit)
      ]);
      
      console.log('📊 Geladene Bestellungen:', {
        restaurant: restaurantOrders.length,
        beauty: beautyAppointments.length,
        maxwell: maxwellOrders.length,
        barMax: barMaxReservations.length,
        conference: conferenceOrders.length,
        contact: contactRequests.length,
        adminMessages: adminMessages.length,
        restaurantBar: restaurantBarOrders.length
      });
      
      const combinedOrders = [
        ...restaurantOrders, 
        ...beautyAppointments,
        ...maxwellOrders,
        ...barMaxReservations,
        ...conferenceOrders,
        ...contactRequests,
        ...adminMessages,
        ...restaurantBarOrders
      ]
        .sort((a, b) => 
          new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        )
        .slice(0, limit);
      
      console.log('✅ Kombinierte Bestellungen:', combinedOrders.length);
      cacheService.set(this.CACHE_KEY_RECENT_ORDERS, combinedOrders, this.CACHE_TTL);
      return combinedOrders;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Bestellungen:', error);
      return [];
    }
  }

  async updateOrderStatus(
    orderId: string, 
    status: string, 
    department: 'restaurant' | 'beauty' | 'maxwell' | 'bar_max' | 'conference' | 'contact' | 'restaurant_bar' | 'admin_message'
  ): Promise<boolean> {
    try {
      let table = 'restaurant_orders';
      if (department === 'beauty') table = 'appointments';
      if (department === 'maxwell') table = 'maxwell_orders';
      if (department === 'bar_max') table = 'bar_max_reservations';
      if (department === 'conference') table = 'conference_orders';
      if (department === 'contact') table = 'contact_requests';
      if (department === 'restaurant_bar') table = 'restaurant_bar_orders';
      if (department === 'admin_message') table = 'admin_messages';
      
      const { error } = await supabase
        .from(table as any)
        .update({ status })
        .eq('id', orderId);
        
      if (error) throw error;
      
      cacheService.invalidate(this.CACHE_KEY_RECENT_ORDERS);
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Update des Status:', error);
      return false;
    }
  }

  async deleteOrder(orderId: string, department: 'restaurant' | 'beauty' | 'maxwell' | 'bar_max' | 'conference' | 'contact' | 'restaurant_bar' | 'admin_message'): Promise<boolean> {
    try {
      let table = 'restaurant_orders';
      if (department === 'beauty') table = 'appointments';
      if (department === 'maxwell') table = 'maxwell_orders';
      if (department === 'bar_max') table = 'bar_max_reservations';
      if (department === 'conference') table = 'conference_orders';
      if (department === 'contact') table = 'contact_requests';
      if (department === 'restaurant_bar') table = 'restaurant_bar_orders';
      if (department === 'admin_message') table = 'admin_messages';
      
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', orderId);
        
      if (error) throw error;
      
      cacheService.invalidate(this.CACHE_KEY_RECENT_ORDERS);
      cacheService.invalidatePattern('orders');
      cacheService.invalidatePattern('recentOrders');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Löschen:', error);
      return false;
    }
  }

  private async getRestaurantOrders(limit: number): Promise<Order[]> {
    console.log('🍽️ Lade Restaurant-Bestellungen...');
    const { data: restaurantOrders } = await supabase
      .from('restaurant_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processRestaurantOrders(restaurantOrders || []);
    console.log(`📊 Restaurant-Bestellungen verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getMaxwellOrders(limit: number): Promise<Order[]> {
    console.log('🏨 Lade Maxwell-Bestellungen...');
    const { data: maxwellOrders } = await supabase
      .from('maxwell_orders')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
      
    const processed = this.processMaxwellOrders(maxwellOrders || []);
    console.log(`📊 Maxwell-Bestellungen verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getBarMaxReservations(limit: number): Promise<Order[]> {
    console.log('🍻 Lade Bar Mäx Reservierungen...');
    const { data: barMaxReservations } = await supabase
      .from('bar_max_reservations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
      
    const processed = this.processBarMaxReservations(barMaxReservations || []);
    console.log(`📊 Bar Mäx Reservierungen verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getConferenceOrders(limit: number): Promise<Order[]> {
    console.log('🏢 Lade Konferenz-Bestellungen...');
    const { data: conferenceOrders } = await supabase
      .from('conference_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processConferenceOrders(conferenceOrders || []);
    console.log(`📊 Konferenz-Bestellungen verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getContactRequests(limit: number): Promise<Order[]> {
    console.log('📞 Lade Kontakt-Anfragen...');
    const { data: contactRequests } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processContactRequests(contactRequests || []);
    console.log(`📊 Kontakt-Anfragen verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getBeautyAppointments(limit: number): Promise<Order[]> {
    console.log('💅 Lade Beauty-Termine...');
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processBeautyAppointments(appointments || []);
    console.log(`📊 Beauty-Termine verarbeitet: ${processed.length}`);
    return processed;
  }

  private processRestaurantOrders(orders: any[]): Order[] {
    return orders.map(order => ({
      id: order.id,
      customer_name: order.name || 'Unbekannter Kunde',
      room_number: order.zustellort || 'Nicht angegeben',
      created_at: order.created_at,
      items: order.speisen || 'Keine Artikel angegeben',
      status: order.status || 'offen',
      department: order.venue === 'Bar Mäx' ? 'bar_max' : 
                  order.venue === 'Bar Mäx Snacks' ? 'bar_max' : 'restaurant',
      kategorie: order.kategorie || (order.venue === 'Bar Mäx' ? 'Bar Mäx' : 
                                   order.venue === 'Bar Mäx Snacks' ? 'Bar Mäx Snacks' : 'Restaurant'),
      priority: order.kategorie === 'Essen/Trinken' || Boolean(order.priority),
      highlight: order.kategorie === 'Essen/Trinken' || Boolean(order.priority),
      contact_value: order.kontakt || 'Keine Kontaktdaten',
      notes: order.sonderwunsche,
      appointment_date: order.wunschzeit,
      total_amount: parseFloat(order.total) || 0,
      venue: order.venue,
      timestamp: format(new Date(order.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }

  private processMaxwellOrders(orders: any[]): Order[] {
    return orders.map(order => ({
      id: order.id,
      customer_name: order.full_name || 'Unbekannter Kunde',
      room_number: order.room_number || order.table_number || 'Nicht angegeben',
      created_at: order.timestamp,
      items: typeof order.order_details === 'object' 
        ? JSON.stringify(order.order_details) 
        : order.order_details || 'Maxwell Bestellung',
      status: order.status || 'new',
      department: 'restaurant',
      kategorie: 'Restaurant Maxwell',
      total_amount: order.total_amount || 0,
      contact_value: 'Maxwell Bestellung',
      notes: order.internal_notes,
      delivery_location: order.delivery_location,
      table_number: order.table_number,
      timestamp: format(new Date(order.timestamp), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }

  private processBarMaxReservations(reservations: any[]): Order[] {
    return reservations.map(reservation => ({
      id: reservation.id,
      customer_name: reservation.full_name || 'Bar-Gast',
      room_number: 'Bar Mäx',
      created_at: reservation.timestamp,
      items: `Reservierung für ${reservation.guests_count} Personen am ${reservation.reservation_date} um ${reservation.reservation_time}`,
      status: reservation.status || 'new',
      department: 'bar_max',
      kategorie: 'Bar Mäx Reservierung',
      guest_count: reservation.guests_count,
      notes: reservation.special_requests || reservation.internal_notes,
      appointment_date: reservation.reservation_date,
      contact_value: 'Bar Reservierung',
      seating_preference: reservation.seating_preference,
      timestamp: format(new Date(reservation.timestamp), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }

  private processConferenceOrders(orders: any[]): Order[] {
    return orders.map(order => {
      let guestInfo: any = {};
      try {
        guestInfo = typeof order.guest_info === 'string' 
          ? JSON.parse(order.guest_info) 
          : order.guest_info || {};
      } catch (e) {
        console.warn('Konnte guest_info nicht parsen:', e);
      }

      return {
        id: order.id,
        customer_name: guestInfo?.name || 'Konferenz-Gast',
        room_number: guestInfo?.conferenceRoom || 'Konferenz',
        created_at: order.created_at,
        items: `Konferenz-Menü für ${order.order_date}`,
        status: order.status || 'new',
        department: 'conference',
        kategorie: 'Konferenz-Bestellung',
        contact_value: 'Konferenz-Service',
        notes: `Firma: ${guestInfo?.company || 'Nicht angegeben'}`,
        order_date: order.order_date,
        lunch_menu: order.lunch_menu,
        dinner_menu: order.dinner_menu,
        guest_info: order.guest_info,
        timestamp: format(new Date(order.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
      };
    });
  }

  private processContactRequests(requests: any[]): Order[] {
    return requests.map(request => {
      let serviceContext = request.service_context;
      if (typeof serviceContext === 'string') {
        try {
          serviceContext = JSON.parse(serviceContext);
        } catch (e) {
          console.warn('Konnte service_context nicht parsen:', e);
          serviceContext = {};
        }
      }

      let complaintsText = 'Kontaktanfrage';
      if (serviceContext?.complaints && Array.isArray(serviceContext.complaints)) {
        complaintsText = serviceContext.complaints.join(', ');
        if (serviceContext.otherComplaint) {
          complaintsText += `, ${serviceContext.otherComplaint}`;
        }
      } else if (serviceContext?.message) {
        complaintsText = serviceContext.message;
      }

      return {
        id: request.id,
        customer_name: request.name || 'Unbekannter Gast',
        room_number: request.room_number || serviceContext?.identifier || 'Nicht angegeben',
        created_at: request.created_at,
        items: complaintsText,
        status: request.status || 'neu',
        department: 'contact',
        kategorie: 'Beschwerde/Kontakt',
        contact_value: request.contact_value,
        contact_type: request.contact_type,
        service_context: request.service_context,
        allow_future_contact: request.allow_future_contact,
        priority: request.status === 'neu',
        timestamp: format(new Date(request.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
      };
    });
  }

  private processBeautyAppointments(appointments: any[]): Order[] {
    return appointments.map(appointment => ({
      id: appointment.id,
      customer_name: appointment.name || 'Unbekannter Kunde',
      room_number: appointment.room_number || 'Nicht angegeben',
      created_at: appointment.created_at,
      items: appointment.treatment_name || 'Beauty Behandlung',
      status: appointment.status || 'pending',
      department: 'beauty',
      contact_value: appointment.contact_value || 'Keine Kontaktdaten',
      notes: appointment.notes,
      appointment_date: appointment.appointment_date ? 
        format(new Date(appointment.appointment_date), 'dd.MM.yyyy', {locale: de}) + 
        (appointment.exact_time ? ` um ${appointment.exact_time}` : ` (${appointment.time_preference})`) :
        'Kein Datum angegeben',
      timestamp: format(new Date(appointment.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }

  private async getAdminMessages(limit: number): Promise<Order[]> {
    console.log('📨 Lade Admin-Nachrichten...');
    const { data: adminMessages } = await supabase
      .from('admin_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processAdminMessages(adminMessages || []);
    console.log(`📊 Admin-Nachrichten verarbeitet: ${processed.length}`);
    return processed;
  }

  private async getRestaurantBarOrders(limit: number): Promise<Order[]> {
    console.log('🍽️🍻 Lade Restaurant-Bar-Bestellungen...');
    const { data: restaurantBarOrders } = await supabase
      .from('restaurant_bar_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    const processed = this.processRestaurantBarOrders(restaurantBarOrders || []);
    console.log(`📊 Restaurant-Bar-Bestellungen verarbeitet: ${processed.length}`);
    return processed;
  }

  private processAdminMessages(messages: any[]): Order[] {
    return messages.map(message => ({
      id: message.id,
      customer_name: message.customer_name || 'Unbekannter Kunde',
      room_number: message.room_number || 'Nicht angegeben',
      created_at: message.created_at,
      items: message.message_content || 'Admin Nachricht',
      status: message.status || 'sent',
      department: 'admin_message',
      kategorie: message.message_type || 'Admin Nachricht',
      contact_value: message.recipient_contact || 'Keine Kontaktdaten',
      notes: message.admin_notes,
      priority: Boolean(message.priority),
      highlight: Boolean(message.priority),
      source_form: message.source_form,
      order_reference: message.order_reference,
      timestamp: format(new Date(message.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }

  private processRestaurantBarOrders(orders: any[]): Order[] {
    return orders.map(order => ({
      id: order.id,
      customer_name: order.customer_name || 'Unbekannter Kunde',
      room_number: order.room_number || order.delivery_location || 'Nicht angegeben',
      created_at: order.created_at,
      items: order.items_text || JSON.stringify(order.items) || 'Restaurant/Bar Bestellung',
      status: order.status || 'pending',
      department: 'restaurant_bar',
      kategorie: order.order_type === 'restaurant_maxwell' ? 'Restaurant Maxwell' : 
                 order.order_type === 'bar_max_snacks' ? 'Bar Mäx Snacks' : 'Bar Mäx',
      priority: Boolean(order.priority),
      highlight: Boolean(order.priority),
      contact_value: order.contact_value || 'Keine Kontaktdaten',
      notes: order.special_requests || order.internal_notes,
      order_type: order.order_type,
      total_amount: order.total_amount || 0,
      venue: order.venue,
      timestamp: format(new Date(order.created_at), 'dd.MM.yyyy, HH:mm', {locale: de})
    }));
  }
}

export const ordersService = new OrdersService();
