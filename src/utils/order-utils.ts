
import { Order, OrderItem } from '@/types/order';

export const convertToAdminCardOrder = (order: any): Order => {
  return {
    id: order.id,
    customer_name: order.customer_name,
    room_number: order.room_number,
    table_number: order.table_number,
    status: order.status,
    total_amount: order.total_amount,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items || [],
    notes: order.notes,
    department: 'room_service',
    timestamp: order.created_at || order.updated_at || new Date().toISOString()
  };
};

export const formatRestaurantOrderForDisplay = (order: any): Order => {
  return {
    id: order.id,
    customer_name: order.full_name || order.name || 'Unbekannter Kunde',
    room_number: order.room_number || order.table_number,
    status: order.status || 'pending',
    total_amount: order.total_amount || 0,
    created_at: order.timestamp || order.created_at,
    items: typeof order.order_details === 'string' ? order.order_details : JSON.stringify(order.order_details || {}),
    department: order.kategorie === 'Bar Mäx' || order.venue === 'Bar Mäx' ? 'bar_max' : 'restaurant',
    kategorie: order.kategorie || 'Restaurant',
    notes: order.internal_notes || order.special_requests,
    delivery_location: order.delivery_location,
    guest_count: order.guests_count,
    table_number: order.table_number,
    timestamp: order.timestamp || order.created_at || new Date().toISOString()
  };
};

export const formatBeautyAppointmentForDisplay = (appointment: any): Order => {
  return {
    id: appointment.id,
    customer_name: appointment.full_name || appointment.name || 'Unbekannter Kunde',
    room_number: appointment.room_number,
    status: appointment.status || 'pending',
    total_amount: 0,
    created_at: appointment.timestamp || appointment.created_at,
    items: appointment.treatment_type || appointment.treatment_name || 'Beauty Behandlung',
    department: 'beauty',
    kategorie: 'Beauty & Wellness',
    notes: appointment.additional_requests || appointment.internal_notes,
    appointment_date: appointment.appointment_date,
    timestamp: appointment.timestamp || appointment.created_at || new Date().toISOString()
  };
};

export const formatConferenceOrderForDisplay = (order: any): Order => {
  console.log('🏢 Formatiere Conference Order für Display:', order);
  
  // Sichere Extraktion der guest_info mit korrekter Typisierung
  let guestInfo: any = {};
  try {
    if (typeof order.guest_info === 'string') {
      guestInfo = JSON.parse(order.guest_info);
    } else if (typeof order.guest_info === 'object' && order.guest_info !== null) {
      guestInfo = order.guest_info;
    }
  } catch (e) {
    console.warn('⚠️ Konnte guest_info nicht parsen:', e);
    guestInfo = {};
  }

  // Sichere Extraktion der Menü-Informationen mit korrekter Typisierung
  let lunchMenu: any = {};
  let dinnerMenu: any = {};
  
  try {
    if (typeof order.lunch_menu === 'string') {
      lunchMenu = JSON.parse(order.lunch_menu);
    } else if (typeof order.lunch_menu === 'object' && order.lunch_menu !== null) {
      lunchMenu = order.lunch_menu;
    }
  } catch (e) {
    console.warn('⚠️ Konnte lunch_menu nicht parsen:', e);
    lunchMenu = {};
  }
  
  try {
    if (typeof order.dinner_menu === 'string') {
      dinnerMenu = JSON.parse(order.dinner_menu);
    } else if (typeof order.dinner_menu === 'object' && order.dinner_menu !== null) {
      dinnerMenu = order.dinner_menu;
    }
  } catch (e) {
    console.warn('⚠️ Konnte dinner_menu nicht parsen:', e);
    dinnerMenu = {};
  }

  // Erstelle eine lesbare Beschreibung der Bestellung
  const menuItems = [];
  if (lunchMenu?.name) {
    menuItems.push(`Mittagsmenü: ${lunchMenu.name}`);
  }
  if (dinnerMenu?.name) {
    menuItems.push(`Abendmenü: ${dinnerMenu.name}`);
  }
  
  const itemsDescription = menuItems.length > 0 
    ? menuItems.join(' | ') 
    : `Tagungsmenü für ${order.order_date || 'unbekanntes Datum'}`;

  return {
    id: order.id,
    customer_name: guestInfo?.name || 'Konferenz-Gast',
    room_number: guestInfo?.conferenceRoom || guestInfo?.room || 'Konferenz',
    status: order.status || 'new',
    total_amount: 0,
    created_at: order.created_at,
    items: itemsDescription,
    department: 'conference',
    kategorie: 'Tagungsmenü',
    notes: `Firma: ${guestInfo?.company || 'Nicht angegeben'}`,
    timestamp: order.created_at || new Date().toISOString()
  };
};

export const formatBarMaxReservationForDisplay = (reservation: any): Order => {
  return {
    id: reservation.id,
    customer_name: reservation.full_name || 'Bar-Gast',
    room_number: 'Bar Mäx',
    status: reservation.status || 'pending',
    total_amount: 0,
    created_at: reservation.timestamp,
    items: `Reservierung für ${reservation.guests_count} Personen am ${reservation.reservation_date}`,
    department: 'bar_max',
    kategorie: 'Bar Mäx Reservierung',
    notes: reservation.special_requests || reservation.internal_notes,
    guest_count: reservation.guests_count,
    appointment_date: reservation.reservation_date,
    timestamp: reservation.timestamp || new Date().toISOString()
  };
};

export const formatContactRequestForDisplay = (request: any): Order => {
  console.log('🔍 Formatiere Contact Request für Display:', request);
  
  // Service Context parsen falls es ein JSON String ist
  let serviceContext = request.service_context;
  if (typeof serviceContext === 'string') {
    try {
      serviceContext = JSON.parse(serviceContext);
    } catch (e) {
      console.warn('Konnte service_context nicht parsen:', e);
      serviceContext = {};
    }
  }

  // Beschwerden aus dem Service Context extrahieren
  let complaintsText = 'Kontaktanfrage';
  if (serviceContext?.selectedComplaints && Array.isArray(serviceContext.selectedComplaints)) {
    complaintsText = serviceContext.selectedComplaints.join(', ');
    if (serviceContext.otherComplaint) {
      complaintsText += `, ${serviceContext.otherComplaint}`;
    }
  } else if (serviceContext?.complaints && Array.isArray(serviceContext.complaints)) {
    complaintsText = serviceContext.complaints.join(', ');
  } else if (serviceContext?.message) {
    complaintsText = serviceContext.message;
  }

  return {
    id: request.id,
    customer_name: request.name || 'Unbekannter Kunde',
    room_number: request.room_number || serviceContext?.identifier || 'Nicht angegeben',
    status: request.status || 'neu',
    total_amount: 0,
    created_at: request.created_at,
    items: complaintsText,
    department: 'contact',
    kategorie: 'Beschwerde',
    notes: `Kontakt: ${request.contact_type} - ${request.contact_value || 'Nicht angegeben'}`,
    contact_value: request.contact_value,
    priority: request.status === 'neu' ? true : false,
    timestamp: request.created_at || new Date().toISOString()
  };
};

export const formatShopOrderForDisplay = (order: any): Order => {
  return {
    id: order.id,
    customer_name: order.customer_name || order.full_name || 'Shop-Kunde',
    room_number: order.room_number || order.delivery_address || 'Shop',
    status: order.status || 'pending',
    total_amount: order.total_amount || 0,
    created_at: order.created_at,
    items: typeof order.items === 'string' ? order.items : JSON.stringify(order.items || {}),
    department: 'shop',
    kategorie: 'Hotel Shop',
    timestamp: order.created_at || new Date().toISOString()
  };
};

export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Neue Funktion für safeMapItems Export
export const safeMapItems = (items: any): OrderItem[] => {
  if (!items) return [];
  
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: item.id || `item-${index}`,
          name: item.name || 'Unbekanntes Item',
          quantity: item.quantity || 1,
          price: item.price || 0
        }));
      }
    } catch (e) {
      // Falls Parsing fehlschlägt, behandle als einfachen String
      return [{
        id: 'single-item',
        name: items,
        quantity: 1
      }];
    }
  }
  
  if (Array.isArray(items)) {
    return items.map((item, index) => ({
      id: item.id || `item-${index}`,
      name: item.name || 'Unbekanntes Item',
      quantity: item.quantity || 1,
      price: item.price || 0
    }));
  }
  
  return [];
};
