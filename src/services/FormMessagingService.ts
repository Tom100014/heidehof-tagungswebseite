// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { FormConfigurationFields } from '@/hooks/useFormConfiguration';
import { openWhatsAppRobust, openSMSRobust } from '@/utils/whatsapp-opener';

export interface MessageData {
  formId: string;
  customerName: string;
  messageContent: string;
  roomNumber?: string;
  contactMethod?: string;
  contactValue?: string;
  preferredMethod?: 'sms' | 'whatsapp' | 'email';
  metadata?: any;
  priority?: boolean;
}

export interface MessagingResult {
  success: boolean;
  appName?: string;
  actionName?: string;
  error?: string;
}

class FormMessagingService {
  private configCache: Map<string, FormConfigurationFields> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  private async getFormConfiguration(formId: string): Promise<FormConfigurationFields | null> {
    // Always refresh cache for debugging - können wir später entfernen
    if (formId === 'beauty-appointments') {
      this.configCache.delete(formId);
      this.cacheExpiry.delete(formId);
      console.log(`🔄 Force refresh for beauty-appointments`);
    }

    // Check cache first
    const cached = this.configCache.get(formId);
    const cacheTime = this.cacheExpiry.get(formId);
    
    if (cached && cacheTime && Date.now() < cacheTime) {
      console.log(`📋 Using cached configuration for ${formId}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching configuration for form: ${formId}`);
      
      // ONLY use form_configurations - NO FALLBACK!
      const { data, error } = await supabase
        .from('form_configurations')
        .select('fields')
        .eq('id', formId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const fields = data.fields as unknown as FormConfigurationFields;
        console.log(`✅ Found configuration for ${formId}`);
        console.log(`📱 Target number: ${fields.target_number}`);
        console.log(`📧 Target email: ${fields.target_email}`);
        
        // Cache the result
        this.configCache.set(formId, fields);
        this.cacheExpiry.set(formId, Date.now() + this.CACHE_DURATION);
        
        return fields;
      }
      
      console.error(`❌ No configuration found for form ${formId} in form_configurations`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error fetching configuration for form ${formId}:`, error);
      return null;
    }
  }

  async sendMessage(messageData: MessageData): Promise<MessagingResult> {
    console.log('🔥 FormMessagingService: sendMessage called with:', messageData);
    
    const config = await this.getFormConfiguration(messageData.formId);
    
    if (!config) {
      return {
        success: false,
        error: 'Formular-Konfiguration konnte nicht geladen werden'
      };
    }

    console.log('📋 FormMessagingService: Form configuration loaded:', config);

    // Use preferred method if specified and enabled
    if (messageData.preferredMethod) {
      console.log(`🎯 FormMessagingService: Using preferred method: ${messageData.preferredMethod}`);
      
      if (messageData.preferredMethod === 'whatsapp' && config.sms_enabled && config.target_number) {
        const result = await this.sendSMSWhatsApp(config.target_number, messageData.messageContent, 'whatsapp', messageData.customerName);
        void this.logAdminMessage(messageData, config.target_number, 'whatsapp');
        return result;
      } else if (messageData.preferredMethod === 'sms' && config.sms_enabled && config.target_number) {
        const result = await this.sendSMSWhatsApp(config.target_number, messageData.messageContent, 'sms', messageData.customerName);
        void this.logAdminMessage(messageData, config.target_number, 'sms');
        return result;
      } else if (messageData.preferredMethod === 'email' && config.email_enabled && config.target_email) {
        const result = await this.sendEmail(config.target_email, messageData, config.emailjs_enabled);
        void this.logAdminMessage(messageData, config.target_email, 'email');
        return result;
      } else {
        return {
          success: false,
          error: `Preferred method ${messageData.preferredMethod} is not enabled in configuration`
        };
      }
    }

    // Fallback to original logic if no preferred method
    const results: MessagingResult[] = [];

    // Send SMS/WhatsApp if enabled (prefer WhatsApp)
    if (config.sms_enabled && config.target_number) {
      const smsResult = await this.sendSMSWhatsApp(
        config.target_number,
        messageData.messageContent,
        'whatsapp'
      );
      results.push(smsResult);

      // Log to admin messages
      void this.logAdminMessage(messageData, config.target_number, 'whatsapp');
    }

    // Send Email if enabled
    if (config.email_enabled && config.target_email) {
      const emailResult = await this.sendEmail(
        config.target_email,
        messageData,
        config.emailjs_enabled
      );
      results.push(emailResult);

      // Log to admin messages
      void this.logAdminMessage(messageData, config.target_email, 'email');
    }

    // Return the first successful result or the first error
    const successResult = results.find(r => r.success);
    return successResult || results[0] || { success: false, error: 'Keine Versandmethode konfiguriert' };
  }

  private async sendSMSWhatsApp(phoneNumber: string, message: string, method: 'sms' | 'whatsapp', customerName?: string): Promise<MessagingResult> {
    try {
      console.log(`🔥 Sende ${method} direkt an: ${phoneNumber}`);
      
      // Verwende die direkten Messaging-Funktionen ohne Twilio
      if (method === 'sms') {
        console.log('🔵 Öffne SMS-App direkt...');
        const smsResult = await openSMSRobust(phoneNumber, message);
        
        return {
          success: smsResult.success,
          appName: 'SMS',
          actionName: smsResult.success ? `SMS geöffnet mit ${smsResult.method}` : 'SMS fehlgeschlagen',
          error: smsResult.error
        };
      } else {
        console.log('🟢 Öffne WhatsApp direkt...');
        const waResult = await openWhatsAppRobust(phoneNumber, message);
        
        return {
          success: waResult.success,
          appName: 'WhatsApp',
          actionName: waResult.success ? `WhatsApp geöffnet mit ${waResult.method}` : 'WhatsApp fehlgeschlagen',
          error: waResult.error
        };
      }
    } catch (error) {
      console.error(`❌ Fehler beim Versenden via ${method}:`, error);
      return {
        success: false,
        appName: method === 'sms' ? 'SMS' : 'WhatsApp',
        actionName: 'Versendung fehlgeschlagen',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendEmail(email: string, messageData: MessageData, useEmailJS: boolean): Promise<MessagingResult> {
    try {
      if (useEmailJS) {
        // Use EmailJS with Supabase Edge Function to access secrets securely
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'email',
            to: email,
            subject: `Neue Nachricht von ${messageData.customerName}`,
            templateParams: {
              customer_name: messageData.customerName,
              form_type: this.getFormName(messageData.formId),
              message_content: messageData.messageContent,
              room_number: messageData.roomNumber || '',
              contact_method: messageData.contactMethod || '',
              contact_value: messageData.contactValue || '',
              timestamp: new Date().toLocaleString('de-DE'),
              priority: messageData.priority ? 'Hoch' : 'Normal'
            }
          }
        });

        if (error) {
          console.error('Error sending email via edge function:', error);
          throw new Error(`EmailJS Fehler: ${error.message}`);
        }

        return {
          success: true,
          appName: 'EmailJS',
          actionName: 'Email erfolgreich versendet'
        };
      } else {
        // Fallback to mailto
        const subject = `Neue Nachricht von ${messageData.customerName}`;
        const body = messageData.messageContent;
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.open(mailtoUrl, '_blank');
        
        return {
          success: true,
          appName: 'Email',
          actionName: 'Email-Client wird geöffnet'
        };
      }
    } catch (error) {
      console.error('Fehler beim Email-Versand:', error);
      return {
        success: false,
        appName: 'Email',
        actionName: 'Email fehlgeschlagen',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async logAdminMessage(messageData: MessageData, recipientContact: string, recipientType: string) {
    try {
      await supabase.from('admin_messages').insert({
        message_type: messageData.formId,
        source_form: this.getFormName(messageData.formId),
        recipient_type: recipientType,
        recipient_contact: recipientContact,
        message_content: messageData.messageContent,
        customer_name: messageData.customerName,
        room_number: messageData.roomNumber,
        metadata: messageData.metadata || {},
        priority: messageData.priority || false,
        status: 'sent'
      });
    } catch (error) {
      console.error('Error logging admin message:', error);
    }
  }

  private getFormName(formId: string): string {
    const formNames: Record<string, string> = {
      'beauty-appointments': 'Beauty Terminbuchung',
      'bar-max': 'Bar Mäx Bestellungen',
      'bar-max-orders': 'Bar Mäx Bestellungen',
      'restaurant-maxwell-orders': 'Bar Mäx Snacks',
      'table-reservations': 'Restaurant Reservierung',
      'shop-orders': 'Shop Bestellungen',
      'conference-service': 'Konferenz Bestellung',
      'conference': 'Konferenz Bestellung',
      'complaints-contact': 'Beschwerden/Kontakt',
      'contact_complaints': 'Beschwerden/Kontakt'
    };
    return formNames[formId] || formId;
  }

  // Legacy support methods for backwards compatibility
  async getPhoneNumber(formId: string): Promise<string | null> {
    const config = await this.getFormConfiguration(formId);
    return config?.sms_enabled ? config.target_number : null;
  }

  async getEmailAddress(formId: string): Promise<string | null> {
    const config = await this.getFormConfiguration(formId);
    return config?.email_enabled ? config.target_email : null;
  }

  // Clear cache (useful for testing or after configuration changes)
  clearCache() {
    this.configCache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ FormMessagingService cache cleared');
  }

  // Force refresh configuration from database
  async refreshConfiguration(formId: string): Promise<FormConfigurationFields | null> {
    // Clear cache for this specific form
    this.configCache.delete(formId);
    this.cacheExpiry.delete(formId);
    console.log(`🔄 Refreshing configuration for ${formId}`);
    return this.getFormConfiguration(formId);
  }
}

// Singleton instance
export const formMessagingService = new FormMessagingService();

// Legacy exports for backwards compatibility
export const handleDirectContact = async (
  method: 'sms' | 'whatsapp',
  formId: string,
  message: string,
  customerName: string,
  roomNumber?: string
): Promise<MessagingResult> => {
  return formMessagingService.sendMessage({
    formId,
    customerName,
    messageContent: message,
    roomNumber,
    metadata: { method }
  });
};