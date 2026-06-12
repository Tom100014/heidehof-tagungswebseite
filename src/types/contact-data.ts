/**
 * Einheitliche Kontaktdaten-Struktur für alle Formulare
 * Diese Typen sollten in allen Formularen verwendet werden für Konsistenz
 */

export interface StandardContactData {
  // Kunde
  customerName: string;
  firstName?: string;
  lastName?: string;
  
  // Unterkunft  
  roomNumber?: string;
  spaKeyNumber?: string;
  guestType?: 'hotel_guest' | 'spa_guest' | 'wellness_guest' | 'room_guest';
  
  // Kontakt
  contactMethod: 'phone' | 'email' | 'whatsapp' | 'sms';
  contactValue: string;
  
  // Optional zusätzliche Felder
  notes?: string;
  allowFutureContact?: boolean;
}

export interface FormSubmissionMetadata {
  // Einheitliche Metadaten für Admin-Anzeige
  customerName: string;
  roomNumber?: string;
  spaKeyNumber?: string;
  contactMethod: string;
  contactValue: string;
  
  // Zusätzliche Daten je nach Formular
  guestType?: string;
  formType?: string;
  sourceForm?: string;
  
  // Original Daten (falls vorhanden)
  firstName?: string;
  lastName?: string;
  name?: string;
  full_name?: string;
  guest_name?: string;
  customer_name?: string;
}

/**
 * Utility-Funktion um Kontaktdaten zu normalisieren
 */
export function normalizeContactData(data: any): FormSubmissionMetadata {
  // Extrahiere Kundenname aus verschiedenen Quellen
  let customerName = 
    data.customerName ||
    data.customer_name ||
    data.guestName ||
    data.guest_name ||
    data.full_name ||
    data.name ||
    (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : '') ||
    (data.firstName || data.lastName);

  // Extrahiere Zimmernummer
  let roomNumber = 
    data.roomNumber ||
    data.room_number ||
    data.zimmerNummer;

  // Extrahiere Spa-Schlüsselnummer  
  let spaKeyNumber = 
    data.spaKeyNumber ||
    data.spa_key_number ||
    data.keyNumber ||
    data.schluesselNummer;

  // Intelligente Extraktion aus message_content falls strukturierte Daten fehlen
  if ((!customerName || customerName === 'Unbekannt') && data.message_content) {
    const messageContent = data.message_content;
    
    // Extrahiere Namen aus verschiedenen Mustern
    const namePatterns = [
      /ich bin\s+([a-zA-ZäöüÄÖÜß\s]+?)(?:\s+und|\.|,|\n|$)/i,
      /mein name ist\s+([a-zA-ZäöüÄÖÜß\s]+?)(?:\s+und|\.|,|\n|$)/i,
      /name:\s*([a-zA-ZäöüÄÖÜß\s]+?)(?:\s*\n|$)/i,
      /von\s+([a-zA-ZäöüÄÖÜß\s]+?)(?:\s+aus|\s+in|\.|,|\n|$)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = messageContent.match(pattern);
      if (match && match[1]) {
        customerName = match[1].trim();
        break;
      }
    }
  }

  // Extrahiere Schlüsselnummer aus message_content
  if (!spaKeyNumber && data.message_content) {
    const keyPatterns = [
      /schlüssel\s*(\d{1,4})/i,
      /key\s*(\d{1,4})/i,
      /spa[\s-]*gast.*?(\d{1,4})/i,
      /\(schlüssel\s*(\d{1,4})\)/i
    ];
    
    for (const pattern of keyPatterns) {
      const match = data.message_content.match(pattern);
      if (match && match[1]) {
        spaKeyNumber = match[1];
        break;
      }
    }
  }

  // Extrahiere Zimmernummer aus message_content
  if (!roomNumber && data.message_content) {
    const roomPatterns = [
      /zimmer\s*(\d{1,4})/i,
      /room\s*(\d{1,4})/i,
      /hotel[\s-]*gast.*?(\d{1,4})/i,
      /\(zimmer\s*(\d{1,4})\)/i
    ];
    
    for (const pattern of roomPatterns) {
      const match = data.message_content.match(pattern);
      if (match && match[1]) {
        roomNumber = match[1];
        break;
      }
    }
  }

  // Extrahiere Kontaktmethode
  const contactMethod = 
    data.contactMethod ||
    data.contact_method ||
    'phone'; // Standard fallback

  // Extrahiere Kontaktwert
  const contactValue = 
    data.contactValue ||
    data.contact_value ||
    data.phoneNumber ||
    data.phone ||
    data.email ||
    data.telefon ||
    '';

  return {
    customerName: customerName?.trim() || 'Unbekannt',
    roomNumber: roomNumber || undefined,
    spaKeyNumber: spaKeyNumber || undefined,
    contactMethod,
    contactValue,
    guestType: data.guestType || data.guest_type,
    formType: data.formType || data.form_type,
    sourceForm: data.sourceForm || data.source_form,
    
    // Behalte originale Daten für Debugging
    firstName: data.firstName,
    lastName: data.lastName,
    name: data.name,
    full_name: data.full_name,
    guest_name: data.guest_name,
    customer_name: data.customer_name
  };
}