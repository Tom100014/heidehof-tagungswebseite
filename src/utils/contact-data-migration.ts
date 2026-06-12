import { StandardContactData, FormSubmissionMetadata } from '@/types/contact-data';

/**
 * Migration-Hilfsfunktionen um bestehende Formulare schrittweise 
 * auf die einheitliche Kontaktdaten-Struktur umzustellen
 */

/**
 * Konvertiert verschiedene Formular-Datenformate in die Standard-Struktur
 */
export function migrateToStandardContactData(formData: any, formType: string): StandardContactData {
  
  // Basis-Kontaktdaten extrahieren
  const customerName = extractCustomerName(formData);
  const { firstName, lastName } = extractNames(formData);
  const { roomNumber, spaKeyNumber, guestType } = extractAccommodationData(formData);
  const { contactMethod, contactValue } = extractContactInfo(formData);
  
  return {
    customerName,
    firstName,
    lastName,
    roomNumber,
    spaKeyNumber,
    guestType: normalizeGuestType(guestType),
    contactMethod: normalizeContactMethod(contactMethod),
    contactValue,
    notes: formData.notes || formData.specialRequests || formData.additional_requests,
    allowFutureContact: formData.allowFutureContact ?? formData.allow_future_contact ?? true
  };
}

/**
 * Erstellt Metadaten für Admin-Anzeige mit Fallbacks
 */
export function createAdminMetadata(formData: any, formType: string): FormSubmissionMetadata {
  const standardData = migrateToStandardContactData(formData, formType);
  
  // PFLICHT: Zimmernummer aus allen verfügbaren Quellen extrahieren
  const roomNumber = extractRoomNumberFromAllSources(formData);
  const spaKeyNumber = extractSpaKeyFromAllSources(formData);
  
  return {
    customerName: standardData.customerName,
    roomNumber: roomNumber || standardData.roomNumber,
    spaKeyNumber: spaKeyNumber || standardData.spaKeyNumber,
    contactMethod: standardData.contactMethod,
    contactValue: standardData.contactValue,
    guestType: standardData.guestType,
    formType,
    sourceForm: formType,
    
    // Behalte originale Daten für Debugging
    firstName: standardData.firstName,
    lastName: standardData.lastName,
    name: formData.name,
    full_name: formData.full_name,
    guest_name: formData.guest_name,
    customer_name: formData.customer_name
  };
}

// === Hilfsfunktionen ===

function extractCustomerName(data: any): string {
  const candidates = [
    data.customerName,
    data.customer_name,
    data.guestName,
    data.guest_name,
    data.full_name,
    data.name,
    (data.firstName && data.lastName) ? `${data.firstName} ${data.lastName}` : null,
    data.firstName,
    data.lastName
  ];
  
  const name = candidates.find(candidate => candidate && candidate.toString().trim());
  return name ? name.toString().trim() : 'Unbekannt';
}

function extractNames(data: any): { firstName?: string; lastName?: string } {
  return {
    firstName: data.firstName || data.first_name,
    lastName: data.lastName || data.last_name || data.name
  };
}

function extractAccommodationData(data: any): { 
  roomNumber?: string; 
  spaKeyNumber?: string; 
  guestType?: string;
} {
  return {
    roomNumber: extractRoomNumberFromAllSources(data),
    spaKeyNumber: extractSpaKeyFromAllSources(data),
    guestType: data.guestType || data.guest_type
  };
}

/**
 * PFLICHT: Extrahiert Zimmernummer aus ALLEN verfügbaren Quellen
 */
export function extractRoomNumberFromAllSources(data: any): string | undefined {
  // Direkte Felder
  let roomNumber = data.roomNumber || 
                   data.room_number || 
                   data.zimmerNummer ||
                   data.bedNumber ||
                   data.tentNumber;

  // Aus Metadaten
  if (!roomNumber && data.metadata) {
    roomNumber = data.metadata.roomNumber || 
                 data.metadata.room_number ||
                 data.metadata.zimmerNummer;
  }

  // Aus Nachrichteninhalt extrahieren (PFLICHT für alle Formulare)
  if (!roomNumber && data.message_content) {
    const roomPatterns = [
      /(?:zimmer[:\s]*|room[:\s]*)(\d{1,4})/i,
      /\(zimmer[:\s]*(\d{1,4})\)/i,
      /hotel[\s-]*gast.*?zimmer[:\s]*(\d{1,4})/i,
      /gast.*?zimmer[:\s]*(\d{1,4})/i
    ];
    
    for (const pattern of roomPatterns) {
      const match = data.message_content.match(pattern);
      if (match && match[1]) {
        roomNumber = match[1];
        break;
      }
    }
  }

  return roomNumber?.toString().trim() || undefined;
}

/**
 * PFLICHT: Extrahiert Spa-Schlüsselnummer aus ALLEN verfügbaren Quellen
 */
export function extractSpaKeyFromAllSources(data: any): string | undefined {
  // Direkte Felder
  let spaKeyNumber = data.spaKeyNumber || 
                     data.spa_key_number || 
                     data.keyNumber || 
                     data.schluesselNummer;

  // Aus Metadaten
  if (!spaKeyNumber && data.metadata) {
    spaKeyNumber = data.metadata.spaKeyNumber || 
                   data.metadata.spa_key_number ||
                   data.metadata.keyNumber ||
                   data.metadata.schluesselNummer;
  }

  // Aus Nachrichteninhalt extrahieren (PFLICHT für alle Formulare)
  if (!spaKeyNumber && data.message_content) {
    const keyPatterns = [
      /(?:schlüssel[:\s]*|key[:\s]*)(\d{1,4})/i,
      /\(schlüssel[:\s]*(\d{1,4})\)/i,
      /spa[\s-]*gast.*?schlüssel[:\s]*(\d{1,4})/i,
      /wellness[\s-]*gast.*?schlüssel[:\s]*(\d{1,4})/i
    ];
    
    for (const pattern of keyPatterns) {
      const match = data.message_content.match(pattern);
      if (match && match[1]) {
        spaKeyNumber = match[1];
        break;
      }
    }
  }

  return spaKeyNumber?.toString().trim() || undefined;
}

function extractContactInfo(data: any): { contactMethod: string; contactValue: string } {
  const method = data.contactMethod || data.contact_method || 'phone';
  const value = data.contactValue || data.contact_value || data.phoneNumber || data.phone || data.email || data.telefon || '';
  
  return {
    contactMethod: method,
    contactValue: value
  };
}

function normalizeGuestType(guestType?: string): StandardContactData['guestType'] {
  if (!guestType) return undefined;
  
  const normalized = guestType.toLowerCase();
  if (normalized.includes('hotel') || normalized.includes('room')) return 'hotel_guest';
  if (normalized.includes('spa') || normalized.includes('wellness')) return 'spa_guest';
  
  return 'hotel_guest'; // Default
}

function normalizeContactMethod(method: string): StandardContactData['contactMethod'] {
  if (!method) return 'phone';
  
  const normalized = method.toLowerCase();
  if (normalized.includes('whatsapp')) return 'whatsapp';
  if (normalized.includes('sms')) return 'sms';
  if (normalized.includes('email') || normalized.includes('mail')) return 'email';
  
  return 'phone'; // Default
}

/**
 * Validierungsfunktionen für Kontaktdaten
 */
export function validateStandardContactData(data: StandardContactData): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (!data.customerName || data.customerName.trim() === '' || data.customerName === 'Unbekannt') {
    errors.push('Kundenname ist erforderlich');
  }
  
  if (!data.contactValue || data.contactValue.trim() === '') {
    errors.push('Kontaktdaten sind erforderlich');
  }
  
  if (data.guestType === 'hotel_guest' && !data.roomNumber) {
    errors.push('Zimmernummer ist für Hotelgäste erforderlich');
  }
  
  if (data.guestType === 'spa_guest' && !data.spaKeyNumber) {
    errors.push('Spa-Schlüsselnummer ist für Spa-Gäste erforderlich');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}