
import { z } from 'zod';

// Gemeinsame Validierungsregeln für alle Formulare
export const ValidationRules = {
  name: z.string()
    .min(3, "Name muss mindestens 3 Buchstaben haben")
    .max(50, "Name darf maximal 50 Zeichen haben")
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-\.]{3,}$/, "Name muss mindestens 3 Buchstaben haben und darf nur Buchstaben, Leerzeichen, Bindestriche und Punkte enthalten")
    .refine(val => !isFakeName(val), "Bitte geben Sie einen gültigen Namen ein"),
  
  firstName: z.string()
    .min(3, "Vorname muss mindestens 3 Buchstaben haben")
    .max(50, "Vorname darf maximal 50 Zeichen haben")
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-\.]{3,}$/, "Vorname muss mindestens 3 Buchstaben haben und darf nur Buchstaben, Leerzeichen, Bindestriche und Punkte enthalten")
    .refine(val => !isFakeName(val), "Bitte geben Sie einen gültigen Vornamen ein"),
  
  lastName: z.string()
    .min(3, "Nachname muss mindestens 3 Buchstaben haben")
    .max(50, "Nachname darf maximal 50 Zeichen haben")
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-\.]{3,}$/, "Nachname muss mindestens 3 Buchstaben haben und darf nur Buchstaben, Leerzeichen, Bindestriche und Punkte enthalten")
    .refine(val => !isFakeName(val), "Bitte geben Sie einen gültigen Nachnamen ein"),
  
  roomNumber: z.string()
    .min(3, "Zimmernummer muss genau 3 Ziffern haben")
    .max(3, "Zimmernummer muss genau 3 Ziffern haben")
    .regex(/^\d{3}$/, "Zimmernummer muss genau 3 Ziffern haben (z.B. 204)")
    .refine(val => isValidRoomNumber(val), "Bitte geben Sie eine gültige 3-stellige Zimmernummer ein"),
  
  keyNumber: z.string()
    .min(3, "Schlüsselnummer muss genau 3 Ziffern haben")
    .max(3, "Schlüsselnummer muss genau 3 Ziffern haben")  
    .regex(/^\d{3}$/, "Schlüsselnummer muss genau 3 Ziffern haben (z.B. 600)")
    .refine(val => isValidKeyNumber(val), "Bitte geben Sie eine gültige 3-stellige Schlüsselnummer ein"),
  
  phone: z.string()
    .min(8, "Telefonnummer muss mindestens 8 Ziffern haben")
    .regex(/^(\+49|0)?[\s\-]?[1-9]\d{1,4}[\s\-]?\d{1,8}$/, "Bitte geben Sie eine gültige deutsche Telefonnummer ein")
    .refine(val => !isFakePhone(val), "Bitte geben Sie eine echte Telefonnummer ein"),
  
  email: z.string()
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein")
    .refine(val => !isFakeEmail(val), "Bitte geben Sie eine echte E-Mail-Adresse ein")
};

// Anti-Fake-System: Erkennung offensichtlich falscher Namen
const fakeNames = [
  'test', 'fake', 'dummy', 'example', 'admin', 'user', 'guest',
  'aaa', 'bbb', 'xxx', 'yyy', 'zzz', 'abc', 'xyz', 'asdf',
  'qwerty', 'password', 'name', 'vorname', 'nachname'
];

const isFakeName = (name: string): boolean => {
  const lowerName = name.toLowerCase().trim();
  
  // Prüfe gegen bekannte Fake-Namen
  if (fakeNames.some(fake => lowerName.includes(fake))) {
    return true;
  }
  
  // Prüfe auf repetitive Zeichen (aaa, bbb, etc.)
  if (/^(.)\1{2,}$/.test(lowerName)) {
    return true;
  }
  
  // Prüfe auf Keyboard-Muster
  if (['qwerty', 'asdf', 'yxcv', '1234', 'abcd'].some(pattern => lowerName.includes(pattern))) {
    return true;
  }
  
  return false;
};

// Enhanced validation using hotel settings
const isValidRoomNumber = (room: string): boolean => {
  const numericValue = parseInt(room);
  
  // Basic range check
  if (numericValue < 1 || numericValue > 999) {
    return false;
  }
  
  // This will be enhanced by the ProfessionalFormField component
  // using real-time hotel settings validation
  return true;
};

const isValidKeyNumber = (key: string): boolean => {
  const numericValue = parseInt(key);
  
  // Basic range check
  if (numericValue < 1 || numericValue > 999) {
    return false;
  }
  
  // This will be enhanced by the ProfessionalFormField component
  // using real-time hotel settings validation
  return true;
};

// Anti-Fake-System für Telefonnummern
const isFakePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  
  // Prüfe auf repetitive Zahlen
  if (/^(\d)\1{6,}$/.test(cleanPhone)) {
    return true;
  }
  
  // Bekannte Fake-Nummern
  const fakePhones = [
    '1234567890', '0987654321', '1111111111', '0000000000',
    '123456789', '111111111', '000000000', '999999999'
  ];
  
  return fakePhones.some(fake => cleanPhone.includes(fake));
};

// Anti-Fake-System für E-Mails
const isFakeEmail = (email: string): boolean => {
  const lowerEmail = email.toLowerCase();
  
  const fakeEmails = [
    'test@test.com', 'fake@fake.com', 'admin@admin.com',
    'user@user.com', 'example@example.com', 'dummy@dummy.com'
  ];
  
  return fakeEmails.includes(lowerEmail) || 
         lowerEmail.includes('test@') ||
         lowerEmail.includes('fake@') ||
         lowerEmail.includes('dummy@');
};

// Hilfsfunktionen für Formatierung
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  
  if (cleaned.startsWith('49')) {
    return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  
  return phone;
};

export const normalizeRoomNumber = (room: string): string => {
  // Stelle sicher, dass die Zimmernummer immer 3-stellig mit führenden Nullen ist
  const numStr = room.trim();
  if (/^\d{1,3}$/.test(numStr)) {
    return numStr.padStart(3, '0');
  }
  return room.trim().toUpperCase();
};

export const normalizeKeyNumber = (key: string): string => {
  // Stelle sicher, dass die Schlüsselnummer immer 3-stellig mit führenden Nullen ist
  const numStr = key.trim();
  if (/^\d{1,3}$/.test(numStr)) {
    return numStr.padStart(3, '0');
  }
  return key.trim().toUpperCase();
};

// Plausibilitätsprüfungen
export const validateFormData = (data: any): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Prüfe auf ungewöhnliche Kombinationen
  if (data.roomNumber && data.name) {
    const roomNum = parseInt(data.roomNumber);
    if (roomNum > 500 && data.name.length < 5) {
      warnings.push("Ungewöhnliche Kombination: Hohe Zimmernummer mit sehr kurzem Namen");
    }
  }
  
  // Prüfe auf Duplikate (vereinfacht)
  if (data.phone && data.phone.length < 10) {
    warnings.push("Telefonnummer scheint unvollständig zu sein");
  }
  
  return { isValid: warnings.length === 0, warnings };
};
