
import { Order } from '@/types/order';

export const formatMaxwellOrderForDisplay = (order: any): Order => {
  console.log('🏨 Formatiere Maxwell Order für Display:', order);
  
  // Sichere Extraktion der Order Details
  let orderDetails = '';
  try {
    if (typeof order.order_details === 'string') {
      orderDetails = order.order_details;
    } else if (typeof order.order_details === 'object' && order.order_details !== null) {
      // Formatiere JSON zu lesbarem String
      if (Array.isArray(order.order_details)) {
        orderDetails = order.order_details.map(item => 
          `${item.quantity || 1}x ${item.name || 'Unbekanntes Item'}`
        ).join(', ');
      } else {
        orderDetails = JSON.stringify(order.order_details);
      }
    } else {
      orderDetails = 'Maxwell Bestellung';
    }
  } catch (e) {
    console.warn('⚠️ Konnte order_details nicht formatieren:', e);
    orderDetails = 'Maxwell Bestellung';
  }

  return {
    id: order.id,
    customer_name: order.full_name || 'Maxwell Gast',
    room_number: order.room_number || order.table_number || 'Restaurant Maxwell',
    status: order.status || 'new',
    total_amount: order.total_amount || 0,
    created_at: order.timestamp,
    items: orderDetails,
    department: 'restaurant',
    kategorie: 'Restaurant Maxwell',
    notes: order.internal_notes,
    delivery_location: order.delivery_location,
    table_number: order.table_number,
    timestamp: order.timestamp || new Date().toISOString()
  };
};

export const formatRestaurantOrderForDisplay = (order: any): Order => {
  console.log('🍽️ Formatiere Restaurant Order für Display:', order);
  
  // Bestimme Kategorie basierend auf venue
  let department = 'restaurant';
  let kategorie = 'Restaurant';
  
  if (order.venue === 'Bar Mäx' || order.kategorie === 'Bar Mäx') {
    department = 'bar_max';
    kategorie = 'Bar Mäx';
  } else if (order.venue === 'Bar Mäx Snacks' || order.kategorie === 'Bar Mäx Snacks') {
    department = 'bar_max';
    kategorie = 'Bar Mäx Snacks';
  } else if (order.venue === 'Restaurant Maxwell' || order.kategorie === 'Restaurant Maxwell') {
    department = 'restaurant';
    kategorie = 'Restaurant Maxwell';
  }

  return {
    id: order.id,
    customer_name: order.name || order.full_name || 'Unbekannter Kunde',
    room_number: order.zustellort || order.room_number || 'Nicht angegeben',
    status: order.status || 'offen',
    total_amount: parseFloat(order.total) || 0,
    created_at: order.created_at,
    items: order.speisen || 'Keine Artikel angegeben',
    department: department,
    kategorie: kategorie,
    notes: order.sonderwunsche || order.internal_notes,
    contact_value: order.kontakt,
    appointment_date: order.wunschzeit,
    venue: order.venue,
    timestamp: order.created_at || new Date().toISOString()
  };
};

export const formatBeautyAppointmentForDisplay = (appointment: any): Order => {
  return {
    id: appointment.id,
    customer_name: appointment.full_name || appointment.name || 'Beauty Kunde',
    room_number: appointment.room_number,
    status: appointment.status || 'new',
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

export const formatBarMaxReservationForDisplay = (reservation: any): Order => {
  return {
    id: reservation.id,
    customer_name: reservation.full_name || 'Bar-Gast',
    room_number: 'Bar Mäx',
    status: reservation.status || 'new',
    total_amount: 0,
    created_at: reservation.timestamp,
    items: `Reservierung für ${reservation.guests_count} Personen am ${reservation.reservation_date} um ${reservation.reservation_time}`,
    department: 'bar_max',
    kategorie: 'Bar Mäx Reservierung',
    notes: reservation.special_requests || reservation.internal_notes,
    guest_count: reservation.guests_count,
    appointment_date: reservation.reservation_date,
    timestamp: reservation.timestamp || new Date().toISOString()
  };
};

export const formatContactRequestForDisplay = (request: any): Order => {
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
    kategorie: 'Beschwerde/Kontakt',
    notes: `Kontakt: ${request.contact_type} - ${request.contact_value || 'Nicht angegeben'}`,
    contact_value: request.contact_value,
    priority: request.status === 'neu',
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

export const formatRestaurantReservationForDisplay = (reservation: any): Order => {
  console.log('🍽️ Formatiere Tischreservierung für Display:', reservation);
  
  return {
    id: reservation.id,
    customer_name: reservation.full_name || 'Reservierung',
    room_number: reservation.room_number || 'Restaurant',
    status: reservation.status || 'new',
    total_amount: 0, // Reservierungen haben keinen Preis
    created_at: reservation.created_at,
    items: `Tischreservierung: ${reservation.person_count || '2'} Personen am ${reservation.reservation_date} um ${reservation.reservation_time}`,
    department: 'restaurant',
    kategorie: 'Tischreservierung',
    notes: reservation.special_requests,
    contact_value: reservation.contact_value,
    appointment_date: `${reservation.reservation_date} ${reservation.reservation_time}`,
    contact_method: reservation.contact_method,
    timestamp: reservation.created_at || new Date().toISOString()
  };
};
