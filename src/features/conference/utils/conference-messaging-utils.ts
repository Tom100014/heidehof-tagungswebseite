import { toast } from "sonner";
import { formMessagingService } from '@/services/FormMessagingService';
import { addHotelFooter } from '@/utils/hotel-footer';
import { formatMessageProfessionally } from '@/utils/local-message-formatter';
import { computeServiceDay } from '@/utils/serviceDay';

// Form ID für das neue Formular System
export const CONFERENCE_FORM_ID = "conference-service";

// Legacy support - wird automatisch aus dem Formular System geladen
export const getConferencePhoneNumber = async (): Promise<string> => {
  const phoneNumber = await formMessagingService.getPhoneNumber(CONFERENCE_FORM_ID);
  if (!phoneNumber) throw new Error('Conference phone number not configured');
  return phoneNumber;
};

// Conference service number (Legacy) - wird automatisch aus der Datenbank geladen
// export const CONFERENCE_SERVICE_PHONE_NUMBER = "+49 176 34177200"; // ENTFERNT - verwende getConferencePhoneNumber()

// Hilfsfunktion zum direkten Kontakt über verschiedene Messaging-Dienste
export const handleConferenceDirectContact = (method: string, phoneNumber: string, message: string) => {
  let url = '';
  let actionName = '';
  let appName = '';
  
  switch (method) {
    case 'sms':
      url = `sms:${phoneNumber.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(message)}`;
      actionName = "SMS wird vorbereitet";
      appName = "Nachrichten-App";
      break;
    case 'whatsapp':
      // WhatsApp erfordert eine spezielle URL-Formatierung
      const formattedNumber = phoneNumber.replace(/[^0-9+]/g, '');
      url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
      actionName = "WhatsApp wird geöffnet";
      appName = "WhatsApp";
      break;
    // Email case removed
  }
  
  if (url) {
    console.log(`Öffne URL: ${url}`);
    
    // Link in neuem Tab öffnen (für Desktop) oder in App (für Mobilgeräte)
    window.open(url, '_blank');
    
    return {
      success: true,
      actionName,
      appName
    };
  }
  
  return {
    success: false
  };
};

// Format für WhatsApp mit Emojis und besserem Layout
export const formatConferenceWhatsAppMessage = (
  personalInfo: any,
  guestType: string,
  lunchMenuDetails: string,
  dinnerMenuDetails: string | null,
  formattedDate: string = ''
) => {
  const getGuestTypeLabel = () => {
    return guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung';
  };

  const getRoomLabel = () => {
    if (!personalInfo) return '';
    const rooms: Record<string, string> = {
      berlin: 'Berlin',
      hamburg: 'Hamburg',
      frankfurt: 'Frankfurt',
      bonn: 'Bonn'
    };
    return rooms[personalInfo.conferenceRoom] || personalInfo.conferenceRoom;
  };

  let message = `
*🏢 Tagungsgast-Bestellung*

Guten Tag, ich bin ${personalInfo.firstName} ${personalInfo.lastName} und melde meine Mahlzeiten an:

*👤 Gastinformationen:*
Name: ${personalInfo.firstName} ${personalInfo.lastName}
Firma: ${personalInfo.company}
Gästetyp: ${getGuestTypeLabel()}
Tagungsraum: ${getRoomLabel()}

*🍽️ Mahlzeiten für ${formattedDate}:*
🍲 Mittagessen: ${lunchMenuDetails}
`;

  if (guestType === 'overnight_guest' && dinnerMenuDetails) {
    message += `🍷 Abendessen: ${dinnerMenuDetails}
`;
  }

  message += `

*🔒 Datenschutz:* Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de

Vielen Dank!
${personalInfo.firstName} ${personalInfo.lastName}
`;

  const baseMessage = `${message}\n\nDatenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de`;
  const professionalMessage = formatMessageProfessionally(baseMessage, personalInfo.firstName + ' ' + personalInfo.lastName);
  return addHotelFooter(professionalMessage);
};

// Kompakte Version für SMS
export const formatConferenceSMSMessage = (
  personalInfo: any,
  guestType: string,
  lunchMenuDetails: string,
  dinnerMenuDetails: string | null,
  formattedDate: string = ''
) => {
  const getGuestTypeLabel = () => {
    return guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung';
  };

  const getRoomLabel = () => {
    if (!personalInfo) return '';
    const rooms: Record<string, string> = {
      berlin: 'Berlin',
      hamburg: 'Hamburg',
      frankfurt: 'Frankfurt',
      bonn: 'Bonn'
    };
    return rooms[personalInfo.conferenceRoom] || personalInfo.conferenceRoom;
  };

  let message = `
Tagungsgast: ${personalInfo.firstName} ${personalInfo.lastName}
Firma: ${personalInfo.company}
Typ: ${getGuestTypeLabel()}
Raum: ${getRoomLabel()}
Datum: ${formattedDate}
Mittagessen: ${lunchMenuDetails}
`;

  if (guestType === 'overnight_guest' && dinnerMenuDetails) {
    message += `Abendessen: ${dinnerMenuDetails}`;
  }

  message += `

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de`;

  // Für Konferenz-Bestellungen: Verwende direkte Bestätigungsnachricht  
  const professionalMessage = formatMessageProfessionally(message.trim(), personalInfo.firstName + ' ' + personalInfo.lastName);
  return addHotelFooter(professionalMessage);
};

// Standard Format für den Text
export const formatConferenceOrderMessage = (
  personalInfo: any,
  guestType: string,
  lunchMenuDetails: string,
  dinnerMenuDetails: string | null,
  formattedDate: string = ''
) => {
  const getGuestTypeLabel = () => {
    return guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung';
  };

  const getRoomLabel = () => {
    if (!personalInfo) return '';
    const rooms: Record<string, string> = {
      berlin: 'Berlin',
      hamburg: 'Hamburg',
      frankfurt: 'Frankfurt',
      bonn: 'Bonn'
    };
    return rooms[personalInfo.conferenceRoom] || personalInfo.conferenceRoom;
  };

  let message = `Tagungsgast-Bestellung\n\n`;
  message += `Name: ${personalInfo.firstName} ${personalInfo.lastName}\n`;
  message += `Firma: ${personalInfo.company}\n`;
  message += `Tagungsraum: ${getRoomLabel()}\n`;
  message += `Gästetyp: ${getGuestTypeLabel()}\n`;
  message += `Datum: ${formattedDate}\n\n`;
  message += `Mittagessen: ${lunchMenuDetails}\n`;
  
  // Only include dinner for overnight guests
  if (guestType === 'overnight_guest' && dinnerMenuDetails) {
    message += `Abendessen: ${dinnerMenuDetails}\n`;
  }
  
  message += `\nDatenschutz: Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de\n`;
  
  return addHotelFooter(message);
};

// Speichert die Bestellung in Supabase (conference_orders + conference_order_items)
export const saveConferenceOrderToSupabase = async (orderData: any) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');

    const orderDateIso = orderData.orderDateIso || computeServiceDay(new Date());

    const parseSelection = (selection: string) => {
      if (!selection) return { category: '', name: '' };
      const parts = selection.split(':');
      return {
        category: parts[0]?.trim() || '',
        name: parts[1]?.trim() || selection,
      };
    };

    const lunchInfo = parseSelection(orderData.mittagessen || '');
    const dinnerInfo = orderData.abendessen ? parseSelection(orderData.abendessen) : null;

    // Map dish category → dish_type enum used by conference_order_items
    const mapDishType = (cat: string): 'fish' | 'meat' | 'vegetarian' => {
      const c = (cat || '').toLowerCase();
      if (c.startsWith('fisch') || c === 'fish') return 'fish';
      if (c.startsWith('fleisch') || c === 'meat') return 'meat';
      return 'vegetarian';
    };

    // Map room name → room_id
    const roomName: string = orderData.tagungsraum || '';
    const roomLabel = roomName.charAt(0).toUpperCase() + roomName.slice(1);
    const { data: roomRow, error: roomErr } = await supabase
      .from('conference_rooms')
      .select('id')
      .ilike('name', roomLabel)
      .maybeSingle();
    if (roomErr) {
      console.error('Raum-Lookup-Fehler:', roomErr);
      return { success: false, error: roomErr };
    }
    if (!roomRow) {
      return { success: false, error: new Error(`Tagungsraum "${roomLabel}" nicht gefunden`) };
    }

    const guestType = orderData.gasttyp || '';
    const notesPayload = JSON.stringify({
      guestType,
      company: orderData.firma || '',
      lunch: lunchInfo,
      dinner: dinnerInfo,
    });

    const mealType: 'lunch' | 'dinner' = guestType === 'overnight_guest' ? 'dinner' : 'lunch';

    const items: Array<{ course: string; dish_type: string; quantity: number }> = [];
    if (lunchInfo.name) {
      items.push({ course: 'main', dish_type: mapDishType(lunchInfo.category), quantity: 1 });
    }
    if (dinnerInfo?.name) {
      items.push({ course: 'main', dish_type: mapDishType(dinnerInfo.category), quantity: 1 });
    }

    const { data: orderId, error: rpcErr } = await supabase.rpc('create_conference_order', {
      p_room_id: roomRow.id,
      p_service_date: orderDateIso,
      p_guest_name: orderData.name || '',
      p_company: orderData.firma || null,
      p_email: orderData.email || null,
      p_meal_type: mealType,
      p_participants: 1,
      p_notes: notesPayload,
      p_items: items as any,
    });

    if (rpcErr || !orderId) {
      console.error('Bestellung speichern fehlgeschlagen:', rpcErr);
      return { success: false, error: rpcErr };
    }

    return { success: true, orderId, data: { id: orderId } };
  } catch (error) {
    console.error('Fehler beim Speichern der Konferenz-Bestellung:', error);
    return { success: false, error };
  }
};

// Neue zentrale Messaging-Funktion
export const sendConferenceMessage = async (
  personalInfo: any,
  guestType: string,
  lunchMenuDetails: string,
  dinnerMenuDetails: string | null,
  formattedDate: string = '',
  method: 'whatsapp' | 'sms' | 'email' = 'whatsapp'
) => {
  const message = method === 'whatsapp' 
    ? formatConferenceWhatsAppMessage(personalInfo, guestType, lunchMenuDetails, dinnerMenuDetails, formattedDate)
    : method === 'sms'
    ? formatConferenceSMSMessage(personalInfo, guestType, lunchMenuDetails, dinnerMenuDetails, formattedDate)
    : formatConferenceOrderMessage(personalInfo, guestType, lunchMenuDetails, dinnerMenuDetails, formattedDate);

  return formMessagingService.sendMessage({
    formId: CONFERENCE_FORM_ID,
    customerName: `${personalInfo.firstName} ${personalInfo.lastName}`,
    contactMethod: method === 'sms' ? 'phone' : method === 'whatsapp' ? 'whatsapp' : 'email',
    contactValue: personalInfo.phoneNumber,
    messageContent: message,
    preferredMethod: method,
    metadata: {
      company: personalInfo.company,
      conferenceRoom: personalInfo.conferenceRoom,
      guestType,
      lunchMenuDetails,
      dinnerMenuDetails,
      date: formattedDate,
      phoneNumber: personalInfo.phoneNumber,
      contactMethod: method === 'sms' ? 'phone' : method === 'whatsapp' ? 'whatsapp' : 'email',
      sendMethod: method
    }
  });
};
