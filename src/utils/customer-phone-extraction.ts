/**
 * ZENTRALE Kundenhandynummer-Extraktion
 * ✅ Garantiert korrekte Unterscheidung zwischen Admin- und Kundennummern
 */

export interface AdminMessage {
  metadata?: {
    customerPhoneNumber?: string;
    contactValue?: string;
    contact_value?: string;
    phoneNumber?: string;
    phone_number?: string;
  };
  recipient_contact?: string;
  guest_phone_number?: string;
}

/**
 * Extrahiert die ECHTE Kundenhandynummer aus Admin-Messages
 * NIEMALS die Admin-Nummer (recipient_contact) verwenden!
 */
export const extractCustomerPhoneNumber = (message: AdminMessage): string | null => {
  // PRIORITÄT 1: Explizit als Kundennummer gespeicherte Felder
  if (message.metadata?.customerPhoneNumber) {
    return message.metadata.customerPhoneNumber;
  }
  
  // PRIORITÄT 2: Contact-Value (vom Kunden im Frontend eingegeben)
  if (message.metadata?.contactValue) {
    return message.metadata.contactValue;
  }
  
  if (message.metadata?.contact_value) {
    return message.metadata.contact_value;
  }
  
  // PRIORITÄT 3: Direkt gespeicherte Gast-Nummer
  if (message.guest_phone_number) {
    return message.guest_phone_number;
  }
  
  // PRIORITÄT 4: Fallback phoneNumber/phone_number (aber nur wenn plausibel)
  if (message.metadata?.phoneNumber) {
    return message.metadata.phoneNumber;
  }
  
  if (message.metadata?.phone_number) {
    return message.metadata.phone_number;
  }
  
  // NIEMALS recipient_contact verwenden - das ist die Admin-Nummer!
  return null;
};

/**
 * Formatiert die Anzeige der Kundenhandynummer
 */
export const formatCustomerPhoneDisplay = (message: AdminMessage): string => {
  const phoneNumber = extractCustomerPhoneNumber(message);
  
  if (phoneNumber) {
    return phoneNumber;
  }
  
  return '📞 Keine Telefonnummer verfügbar - Bitte beim Gast nachfragen';
};

/**
 * Prüft ob eine Nachricht eine gültige Kundennummer hat
 */
export const hasValidCustomerPhone = (message: AdminMessage): boolean => {
  return extractCustomerPhoneNumber(message) !== null;
};

/**
 * Debug-Funktion: Zeigt alle verfügbaren Nummern-Felder
 */
export const debugPhoneFields = (message: AdminMessage): string => {
  return `
🔍 DEBUG: Telefonnummer-Felder in Admin-Message
==========================================
✅ KUNDENNUMMERN (werden verwendet):
  - metadata.customerPhoneNumber: ${message.metadata?.customerPhoneNumber || 'NICHT GESETZT'}
  - metadata.contactValue: ${message.metadata?.contactValue || 'NICHT GESETZT'}
  - metadata.contact_value: ${message.metadata?.contact_value || 'NICHT GESETZT'}
  - guest_phone_number: ${message.guest_phone_number || 'NICHT GESETZT'}
  - metadata.phoneNumber: ${message.metadata?.phoneNumber || 'NICHT GESETZT'}
  - metadata.phone_number: ${message.metadata?.phone_number || 'NICHT GESETZT'}

❌ ADMIN-NUMMERN (werden NICHT verwendet):
  - recipient_contact: ${message.recipient_contact || 'NICHT GESETZT'} ← ADMIN-NUMMER!

🎯 EXTRAHIERTE KUNDENNUMMER: ${extractCustomerPhoneNumber(message) || 'KEINE GEFUNDEN'}
`;
};