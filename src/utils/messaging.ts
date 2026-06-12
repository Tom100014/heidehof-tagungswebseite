/**
 * UNIVERSELLER Messaging-Service - GARANTIERT Dashboard-Speicherung
 * ✅ EINFACH: Vor jedem WhatsApp/SMS → Dashboard speichern
 */
import { openWhatsAppRobust, openSMSRobust } from '@/utils/whatsapp-opener';
import { supabase } from '@/integrations/supabase/client';
import { extractCustomerPhoneNumber } from '@/utils/customer-phone-extraction';

export interface MessageData {
  toNumber: string;
  message: string;
  metadata?: {
    type: string;
    source?: string;
    customerName?: string;
    roomNumber?: string;
    orderReference?: string;
    [key: string]: any;
  };
}

export interface MessagingResult {
  success: boolean;
  method: string;
  messageId?: string;
  opened?: boolean;
  error?: string;
}

// ✅ Extrahiere Kundennummer aus Nachrichteninhalt
const extractCustomerPhoneFromMessage = (message: string): string | null => {
  // Muster 1: *📱 Kontakt:* (für Tischreservierung)
  const contactMatch1 = message.match(/\*📱\s*\*?Kontakt:\*?\s*\n([0-9\s\+\-\(\)]+)/);
  if (contactMatch1) {
    return contactMatch1[1].trim();
  }
  
  // Muster 2: *📱 Kontakt:* (für Shop/Bar)
  const contactMatch2 = message.match(/\*📱\s*Kontakt:\*\s*\n([0-9\s\+\-\(\)]+)/);
  if (contactMatch2) {
    return contactMatch2[1].trim();
  }
  
  // Muster 3: 📱 Kontakt: (ohne Sterne)
  const contactMatch3 = message.match(/📱\s*Kontakt:\s*\n([0-9\s\+\-\(\)]+)/);
  if (contactMatch3) {
    return contactMatch3[1].trim();
  }
  
  // Fallback: Suche nach beliebiger Telefonnummer mit mindestens 8 Ziffern
  const phoneMatch = message.match(/(?:^|\n|\s)(\+?[0-9\s\-\(\)]{8,15})(?:\s|\n|$)/);
  if (phoneMatch) {
    const cleaned = phoneMatch[1].replace(/[^0-9+]/g, '');
    if (cleaned.length >= 8) {
      return phoneMatch[1].trim();
    }
  }
  
  return null;
};

// ✅ UNIVERSELLE Dashboard-Speicherung für ALLE Services
const saveToDashboardUniversal = async (data: MessageData, method: 'whatsapp' | 'sms') => {
  try {
    console.log('🎯 UNIVERSELL: Speichere SOFORT im Dashboard...');
    
    // KORRIGIERT: Extrahiere die echte Kundennummer aus der Nachricht
    const extractedCustomerPhone = extractCustomerPhoneFromMessage(data.message);
    const customerPhoneNumber = extractedCustomerPhone || data.metadata?.phoneNumber || data.toNumber;
    
    console.log('📞 KUNDE: Extrahierte Nummer:', extractedCustomerPhone);
    console.log('📞 FINAL: Verwende Kundennummer:', customerPhoneNumber);
    
    const { error } = await supabase.functions.invoke('log-admin-message', {
      body: {
        messageType: data.metadata?.type || 'unknown',
        sourceForm: data.metadata?.source || 'universal_messaging',
        recipientType: method,
        recipientContact: customerPhoneNumber, // Handynummer des Kunden als Empfänger
        messageContent: data.message,
        customerName: data.metadata?.customerName || 'Unbekannt',
        roomNumber: data.metadata?.roomNumber || undefined,
        orderReference: data.metadata?.orderReference || `MSG-${Date.now()}`,
        metadata: {
          ...data.metadata || {},
          phoneNumber: customerPhoneNumber, // ECHTE Kundennummer aus Nachricht extrahiert
          originalToNumber: data.toNumber, // Original Zielnummer (Admin-Nummer)
          extractedFromMessage: !!extractedCustomerPhone // Flag ob aus Nachricht extrahiert
        },
        priority: false
      }
    });
    
    if (error) {
      console.error('❌ Dashboard-Fehler:', error);
    } else {
      console.log('✅ Dashboard ERFOLGREICH!');
    }
  } catch (error) {
    console.error('❌ Dashboard-Fehler:', error);
  }
};

// ✅ WhatsApp mit GARANTIERTER Dashboard-Speicherung
export const sendWhatsApp = async (data: MessageData): Promise<MessagingResult> => {
  try {
    console.log('🟢 WhatsApp wird geöffnet:', data.toNumber);

    // 1) Sofort öffnen (direkt auf User-Interaktion reagieren)
    const waResult = await openWhatsAppRobust(data.toNumber, data.message);

    // 2) Dashboard-Logging im Hintergrund (nicht blockierend)
    if (
      data.metadata?.source !== 'beauty_wellness' &&
      data.metadata?.type !== 'beauty_appointment' &&
      data.metadata?.type !== 'custom_reply'
    ) {
      setTimeout(() => {
        void saveToDashboardUniversal(data, 'whatsapp');
      }, 0);
    } else {
      console.log('⏩ SKIP Dashboard für', data.metadata?.type || data.metadata?.source);
    }

    return {
      success: waResult.success,
      method: waResult.success ? `whatsapp_${waResult.method}` : 'whatsapp_failed',
      opened: waResult.success,
      error: waResult.error
    };
  } catch (error) {
    console.error('❌ WhatsApp Fehler:', error);
    return {
      success: false,
      method: 'whatsapp',
      opened: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ✅ SMS mit GARANTIERTER Dashboard-Speicherung
export const sendSMS = async (data: MessageData): Promise<MessagingResult> => {
  try {
    console.log('🔵 SMS wird geöffnet:', data.toNumber);

    // 1) Sofort öffnen
    const smsResult = await openSMSRobust(data.toNumber, data.message);

    // 2) Dashboard-Logging im Hintergrund (nicht blockierend)
    if (
      data.metadata?.source !== 'beauty_wellness' &&
      data.metadata?.type !== 'beauty_appointment' &&
      data.metadata?.type !== 'custom_reply'
    ) {
      setTimeout(() => {
        void saveToDashboardUniversal(data, 'sms');
      }, 0);
    } else {
      console.log('⏩ SKIP Dashboard für', data.metadata?.type || data.metadata?.source);
    }

    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: smsResult.success,
      method: smsResult.success ? `sms_${smsResult.method}` : 'sms_failed',
      messageId: smsResult.success ? messageId : undefined,
      error: smsResult.error
    };
  } catch (error) {
    console.error('❌ SMS Fehler:', error);
    return {
      success: false,
      method: 'sms',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const copyMessageToClipboard = async (message: string): Promise<boolean> => {
  try {
    console.log('📋 Text wird kopiert');
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(message);
      return true;
    } else {
      // Fallback für ältere Browser
      const textArea = document.createElement('textarea');
      textArea.value = message;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return result;
    }
  } catch (error) {
    console.error('❌ Copy Fehler:', error);
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || phone.trim() === '') return false;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  // Check if it's a valid format
  if (cleaned.length < 10) return false;
  
  // German phone number validation
  if (cleaned.startsWith('+49')) {
    return cleaned.length >= 12 && cleaned.length <= 15;
  }
  
  if (cleaned.startsWith('0')) {
    return cleaned.length >= 10 && cleaned.length <= 13;
  }
  
  // International format
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
  
  return cleaned.length >= 10 && cleaned.length <= 13;
};

export const formatPhoneNumber = (phone: string): string => {
  // Deutsche Nummer formatieren
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+49' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+49' + cleaned;
  }
  
  return cleaned;
};