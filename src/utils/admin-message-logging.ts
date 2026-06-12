import { supabase } from '@/integrations/supabase/client';

export interface MessageLogData {
  messageType: string;
  sourceForm: string;
  recipientType: 'whatsapp' | 'sms' | 'email';
  recipientContact: string;
  messageContent: string;
  customerName?: string;
  customerPhone?: string;
  roomNumber?: string;
  orderReference?: string;
  metadata?: any;
  priority?: boolean;
}

export const logAdminMessage = async (data: MessageLogData) => {
  try {
    console.log('📨 UTILS: logAdminMessage aufgerufen mit:', {
      messageType: data.messageType,
      sourceForm: data.sourceForm,
      recipientType: data.recipientType,
      customerName: data.customerName,
      roomNumber: data.roomNumber,
      fullData: data
    });
    
    // Validierung der Daten
    if (!data.messageType || !data.sourceForm || !data.recipientType || !data.messageContent) {
      const missingFields = [];
      if (!data.messageType) missingFields.push('messageType');
      if (!data.sourceForm) missingFields.push('sourceForm');
      if (!data.recipientType) missingFields.push('recipientType');
      if (!data.messageContent) missingFields.push('messageContent');
      
      console.error('❌ UTILS: Fehlende Pflichtfelder:', missingFields);
      console.warn('⚠️ UTILS: Versuche trotzdem das Logging - ohne Fehler zu werfen');
      // Nicht mehr einen Fehler werfen, sondern weitermachen
    }
    
    console.log('📨 UTILS: Rufe Supabase Edge Function auf...');
    const { data: result, error } = await supabase.functions.invoke('log-admin-message', {
      body: data
    });

    if (error) {
      console.error('❌ UTILS: Fehler beim Aufrufen der log-admin-message Funktion:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        statusCode: error.statusCode
      });
      console.warn('⚠️ UTILS: Logging-Fehler ignoriert - Bestellung geht trotzdem weiter');
      // Nicht mehr einen Fehler werfen, damit die Bestellung weitergehen kann
      return { success: false, error: error.message };
    }

    console.log('✅ UTILS: Admin message erfolgreich geloggt:', result);
    return result;
  } catch (error) {
    console.error('❌ UTILS: Kritischer Fehler beim Admin-Message-Logging:', {
      error,
      errorMessage: error.message,
      errorStack: error.stack,
      inputData: data
    });
    console.warn('⚠️ UTILS: Logging-Fehler ignoriert - Bestellung geht trotzdem weiter');
    // Auch hier keinen Fehler mehr werfen
    return { success: false, error: error.message };
  }
};