import { z } from 'zod';
import { ValidationRules } from './form-validation';

// Einheitliche Hotel-validierte Schemas für alle Formulare
export const UnifiedFormValidation = {
  // Basis Gast-Daten
  guestInfo: z.object({
    firstName: ValidationRules.firstName,
    lastName: ValidationRules.lastName,
    name: ValidationRules.name.optional(), // Für Kompatibilität mit älteren Formularen
  }),

  // Hotel-spezifische Felder mit automatischer Validierung
  hotelFields: z.object({
    guestType: z.enum(['hotel_guest', 'room_guest', 'wellness_guest', 'spa_guest', 'external_guest']),
    roomNumber: ValidationRules.roomNumber.optional(),
    spaKeyNumber: ValidationRules.keyNumber.optional(),
  }),

  // Kontakt-Validierung
  contactInfo: z.object({
    contactMethod: z.enum(['phone', 'email', 'whatsapp', 'sms', 'none']),
    contactValue: z.string().optional(),
    phone: ValidationRules.phone.optional(),
    email: ValidationRules.email.optional(),
  }),

  // Reservierungs/Termin-Felder
  appointmentInfo: z.object({
    appointmentDate: z.date().optional(),
    reservationDate: z.string().min(1, "Datum ist erforderlich").optional(),
    appointmentTime: z.string().optional(),
    reservationTime: z.string().optional(),
    exactTime: z.string().optional(),
    timePreference: z.enum(['morning', 'afternoon', 'evening']).optional(),
  }),

  // Zusätzliche Informationen
  additionalInfo: z.object({
    notes: z.string().max(2000, 'Notizen zu lang').optional(),
    specialRequests: z.string().max(2000, 'Wünsche zu lang').optional(),
    allergies: z.string().max(1000, 'Allergie-Angaben zu lang').optional(),
    additionalInfo: z.string().max(1000, 'Zusatzinformationen zu lang').optional(),
  }),

  // Datenschutz und rechtliche Zustimmungen
  legalConsent: z.object({
    privacyAccepted: z.boolean().refine(val => val === true, {
      message: 'Datenschutzerklärung muss akzeptiert werden'
    }),
    termsAccepted: z.boolean().optional(),
    allowFutureContact: z.boolean().default(false),
  }),

  // Dynamische Validierung basierend auf Gasttyp
  validateByGuestType: (data: { guestType?: string; roomNumber?: string; spaKeyNumber?: string }) => {
    const errors: string[] = [];

    if (data.guestType === 'hotel_guest' || data.guestType === 'room_guest') {
      if (!data.roomNumber || data.roomNumber.trim().length === 0) {
        errors.push('Zimmernummer ist für Hotelgäste erforderlich');
      } else if (!ValidationRules.roomNumber.safeParse(data.roomNumber).success) {
        errors.push('Gültige 3-stellige Zimmernummer erforderlich');
      }
    }

    if (data.guestType === 'wellness_guest' || data.guestType === 'spa_guest') {
      if (!data.spaKeyNumber || data.spaKeyNumber.trim().length === 0) {
        errors.push('Spa-Schlüsselnummer ist für Wellness-Gäste erforderlich');
      } else if (!ValidationRules.keyNumber.safeParse(data.spaKeyNumber).success) {
        errors.push('Gültige 3-stellige Spa-Schlüsselnummer erforderlich');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Vorgefertigte Schemas für häufige Anwendungsfälle
export const CommonFormSchemas = {
  // Beauty/Wellness Termine
  beautyAppointment: z.object({
    ...UnifiedFormValidation.guestInfo.shape,
    ...UnifiedFormValidation.hotelFields.shape,
    ...UnifiedFormValidation.appointmentInfo.shape,
    ...UnifiedFormValidation.additionalInfo.shape,
    ...UnifiedFormValidation.legalConsent.shape,
    treatmentId: z.string().optional(),
    treatmentName: z.string().optional(),
  }).refine((data) => {
    const validation = UnifiedFormValidation.validateByGuestType(data);
    return validation.isValid;
  }, {
    message: "Gast-spezifische Validierung fehlgeschlagen",
    path: ["guestType"]
  }),

  // Restaurant/Bar Bestellungen
  restaurantOrder: z.object({
    ...UnifiedFormValidation.guestInfo.shape,
    ...UnifiedFormValidation.hotelFields.shape,
    ...UnifiedFormValidation.contactInfo.shape,
    ...UnifiedFormValidation.additionalInfo.shape,
    ...UnifiedFormValidation.legalConsent.shape,
    deliveryLocation: z.string().min(1, "Lieferort erforderlich"),
    desiredTime: z.string().min(1, "Lieferzeit erforderlich"),
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().min(1),
      price: z.string().optional(),
    })).min(1, "Mindestens ein Artikel erforderlich"),
  }).refine((data) => {
    const validation = UnifiedFormValidation.validateByGuestType(data);
    return validation.isValid;
  }, {
    message: "Gast-spezifische Validierung fehlgeschlagen",
    path: ["guestType"]
  }),

  // Tischreservierungen
  tableReservation: z.object({
    ...UnifiedFormValidation.guestInfo.shape,
    ...UnifiedFormValidation.hotelFields.shape,
    ...UnifiedFormValidation.contactInfo.shape,
    ...UnifiedFormValidation.additionalInfo.shape,
    ...UnifiedFormValidation.legalConsent.shape,
    reservationDate: z.string().min(1, "Datum erforderlich"),
    reservationTime: z.string().min(1, "Uhrzeit erforderlich"),
    guestCount: z.string().min(1, "Personenanzahl erforderlich"),
  }).refine((data) => {
    if (data.guestType === 'hotel_guest') {
      return data.roomNumber && ValidationRules.roomNumber.safeParse(data.roomNumber).success;
    }
    return true;
  }, {
    message: "Hotelgäste benötigen gültige Zimmernummer",
    path: ["roomNumber"]
  }),

  // Allgemeine Kontaktanfragen
  contactRequest: z.object({
    ...UnifiedFormValidation.guestInfo.shape,
    ...UnifiedFormValidation.hotelFields.shape,
    ...UnifiedFormValidation.contactInfo.shape,
    ...UnifiedFormValidation.additionalInfo.shape,
    ...UnifiedFormValidation.legalConsent.shape,
    subject: z.string().min(1, "Betreff erforderlich"),
    category: z.enum(['complaint', 'request', 'compliment', 'question', 'other']),
  }),
};

// Hilfsfunktionen für Formular-Validierung
export const FormValidationHelpers = {
  // Prüft ob ein Feld hotel-spezifische Validierung benötigt
  requiresHotelValidation: (fieldName: string, guestType?: string) => {
    if (fieldName === 'roomNumber') {
      return guestType === 'hotel_guest' || guestType === 'room_guest';
    }
    if (fieldName === 'spaKeyNumber') {
      return guestType === 'wellness_guest' || guestType === 'spa_guest';
    }
    return false;
  },

  // Formatiert Fehlermeldungen einheitlich
  formatValidationError: (error: string, fieldName: string) => {
    const fieldLabels: Record<string, string> = {
      firstName: 'Vorname',
      lastName: 'Nachname',
      name: 'Name',
      roomNumber: 'Zimmernummer',
      spaKeyNumber: 'Spa-Schlüsselnummer',
      email: 'E-Mail',
      phone: 'Telefonnummer',
    };

    const label = fieldLabels[fieldName] || fieldName;
    return `${label}: ${error}`;
  },

  // Normalisiert Eingaben für konsistente Speicherung
  normalizeFormData: (data: any) => {
    const normalized = { ...data };

    // Namen bereinigen
    if (normalized.firstName) {
      normalized.firstName = normalized.firstName.trim();
    }
    if (normalized.lastName) {
      normalized.lastName = normalized.lastName.trim();
    }
    if (normalized.name) {
      normalized.name = normalized.name.trim();
    }

    // Hotel-Nummern normalisieren
    if (normalized.roomNumber) {
      normalized.roomNumber = normalized.roomNumber.trim().padStart(3, '0');
    }
    if (normalized.spaKeyNumber) {
      normalized.spaKeyNumber = normalized.spaKeyNumber.trim().padStart(3, '0');
    }

    // Kontakt-Daten bereinigen
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase().trim();
    }
    if (normalized.phone) {
      normalized.phone = normalized.phone.replace(/\s+/g, ' ').trim();
    }

    return normalized;
  }
};