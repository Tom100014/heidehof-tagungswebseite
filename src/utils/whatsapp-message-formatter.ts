import { Order } from "@/types/order";
import { ReservationMessageTemplateService } from "@/services/reservation/message-template.service";
import { BarMaxMessageTemplateService, BarMaxOrderData } from "@/services/message-templates/bar-max-template.service";
import { ConferenceMessageTemplateService, ConferenceOrderData } from "@/services/message-templates/conference-template.service";
import { BeautyMessageTemplateService, BeautyAppointmentData } from "@/services/message-templates/beauty-template.service";
import { ContactMessageTemplateService, ContactRequestData } from "@/services/message-templates/contact-template.service";
import { ShopMessageTemplateService, ShopOrderData } from "@/services/message-templates/shop-template.service";

/**
 * Formatiert WhatsApp-Nachrichten für alle Bestellsysteme
 * WICHTIG: Footer sollten von den Hooks geladen und übergeben werden
 * 
 * @param order - Die Bestellung
 * @param hotelFooter - Hotel-Footer aus hotel_settings (optional)
 * @param promotionalFooter - Werbe-Footer aus hotel_settings (optional)
 */
export function formatWhatsAppMessage(order: Order, hotelFooter?: string, promotionalFooter?: string): string {
  try {
    let message = '';
    
    switch (order.department) {
      case 'restaurant':
      case 'restaurant_maxwell':
        message = formatRestaurantMessage(order);
        break;
      
      case 'bar_max':
        message = formatBarMaxMessage(order);
        break;
      
      case 'conference':
        message = formatConferenceMessage(order, hotelFooter, promotionalFooter);
        break;
      
      case 'beauty':
      case 'beauty_treatment':
        message = formatBeautyMessage(order, hotelFooter, promotionalFooter);
        break;
      
      case 'contact':
        message = formatContactMessage(order, hotelFooter, promotionalFooter);
        break;
      
      case 'shop':
        message = formatShopMessage(order, hotelFooter, promotionalFooter);
        break;
      
      default:
        message = `📋 Neue Anfrage von ${order.customer_name || 'Unbekannter Kunde'}

Kategorie: ${order.kategorie || 'Allgemein'}
${order.notes ? `Nachricht: ${order.notes}` : ''}
${order.room_number ? `Zimmer: ${order.room_number}` : ''}`;
        break;
    }
    
    return message || `Bestellung #${order.id.slice(-8)} - ${order.customer_name || 'Kunde'}`;
  } catch (error) {
    console.error('Fehler beim Formatieren der WhatsApp-Nachricht:', error);
    return `📋 Bestellung #${order.id.slice(-8)}

Kunde: ${order.customer_name || 'Unbekannt'}
${order.room_number ? `Zimmer: ${order.room_number}` : ''}
${order.notes ? `Details: ${order.notes}` : ''}

Status: ${order.status}`;
  }
}

function formatRestaurantMessage(order: Order): string {
  const reservationData = {
    full_name: order.customer_name || 'Unbekannt',
    room_number: (order.room_number || 'Unbekannt').toString(),
    spa_key_number: order.key_number || 'Unbekannt',
    reservation_date: new Date(order.appointment_date || Date.now()),
    reservation_time: order.exact_time || 'Unbekannt',
    person_count: order.guest_count?.toString() || '2',
    contact_value: order.contact_value || 'Keine Angabe',
    privacyAccepted: true,
    allowFutureContact: true
  };
  
  return ReservationMessageTemplateService.formatWhatsAppMessage(reservationData, "Restaurant Maxwell");
}

function formatBarMaxMessage(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    return sum + (price * item.quantity);
  }, 0);
  
  // Check if room service applies (hotel guest with room number ordering to room)
  const isRoomService = order.delivery_location === 'Zimmer' && order.room_number;
  const roomServiceFee = isRoomService ? 5.00 : 0;
  const totalAmount = subtotal + roomServiceFee;
  
  const barMaxData: BarMaxOrderData = {
    customer_name: order.customer_name || 'Unbekannt',
    room_number: order.room_number?.toString(),
    table_number: order.table_number,
    contact_method: order.contact_method || 'WhatsApp',
    contact_value: order.contact_value,
    delivery_location: order.delivery_location || 'Unbekannt',
    desired_time: order.exact_time || 'So bald wie möglich',
    items: items,
    total_amount: totalAmount,
    special_requests: order.special_requests,
    venue: order.venue || 'Bar Mäx'
  };
  
  return BarMaxMessageTemplateService.formatWhatsAppMessage(barMaxData);
}

function formatConferenceMessage(order: Order, hotelFooter?: string, promotionalFooter?: string): string {
  const conferenceData: ConferenceOrderData = {
    guest_info: {
      firstName: order.customer_name?.split(' ')[0] || 'Unbekannt',
      lastName: order.customer_name?.split(' ').slice(1).join(' ') || '',
      company: '', // Company nicht in Order-Type verfügbar
      conferenceRoom: order.conference_room || 'Unbekannt',
      guestType: order.guest_type || 'Tagungsgast'
    },
    lunch_menu: order.lunch_menu || {},
    dinner_menu: order.dinner_menu,
    order_date: order.order_date || new Date().toLocaleDateString('de-DE'),
    hotelFooter,
    promotionalFooter
  };
  
  return ConferenceMessageTemplateService.formatWhatsAppMessage(conferenceData);
}

function formatBeautyMessage(order: Order, hotelFooter?: string, promotionalFooter?: string): string {
  const beautyData: BeautyAppointmentData = {
    name: order.customer_name || 'Unbekannt',
    room_number: order.room_number?.toString(),
    contact_method: order.contact_method || 'WhatsApp',
    contact_value: order.contact_value || 'Keine Angabe',
    appointment_date: order.appointment_date || new Date().toLocaleDateString('de-DE'),
    time_preference: order.time_preference || 'morning',
    exact_time: order.exact_time,
    treatment_name: order.treatment_name || 'Beauty-Behandlung',
    treatment_id: '', // Nicht in Order-Type verfügbar
    notes: order.notes,
    guest_type: order.guest_type,
    hotelFooter,
    promotionalFooter
  };
  
  return BeautyMessageTemplateService.formatWhatsAppMessage(beautyData);
}

function formatContactMessage(order: Order, hotelFooter?: string, promotionalFooter?: string): string {
  const contactData: ContactRequestData = {
    name: order.customer_name || 'Unbekannt',
    contact_type: order.contact_method || 'WhatsApp',
    contact_value: order.contact_value,
    room_number: order.room_number?.toString(),
    category: order.kategorie,
    complaint_text: order.notes || order.complaint_message,
    service_context: order.service_context,
    priority: order.priority ? 'Hoch' : 'Normal',
    hotelFooter,
    promotionalFooter
  };
  
  return ContactMessageTemplateService.formatWhatsAppMessage(contactData);
}

function formatShopMessage(order: Order, hotelFooter?: string, promotionalFooter?: string): string {
  const shopData: ShopOrderData = {
    customer_name: order.customer_name || 'Unbekannt',
    items: Array.isArray(order.items) ? order.items : [],
    delivery_location: order.delivery_location || 'Zimmer',
    contact_method: order.contact_method || 'WhatsApp',
    contact_value: order.contact_value,
    total_amount: order.total_amount || 0,
    room_number: order.room_number?.toString(),
    hotelFooter,
    promotionalFooter
  };
  
  return ShopMessageTemplateService.formatWhatsAppMessage(shopData);
}