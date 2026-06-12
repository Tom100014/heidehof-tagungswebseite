
import { apiService } from '@/services/api/supabase-api';
import { cacheService } from '@/services/cache/cache-service';
import { ContactFormValues } from '@/components/data-input/ContactFormSchema';

/**
 * Service für die Verwaltung von Kontaktanfragen und Beschwerden
 */
class ContactService {
  private CACHE_KEY_CONTACT_REQUESTS = 'contact-requests';
  
  /**
   * Speichert eine neue Beschwerde/Kontaktanfrage
   */
  async saveContactRequest(contactData: ContactFormValues): Promise<{ success: boolean; error?: Error }> {
    try {
      // Daten für die API aufbereiten
      const requestData = {
        name: contactData.name,
        contactType: contactData.contactMethod,
        contactValue: contactData.contactValue,
        allowFutureContact: contactData.allowFutureContact,
        serviceContext: contactData.serviceDetails,
        roomNumber: contactData.roomNumber
      };
      
      // Prüfen, ob der Benutzer online ist
      if (!navigator.onLine) {
        // Offline-Anfrage für spätere Synchronisierung speichern
        const saved = await apiService.saveOfflineRequest('store-contact-request', requestData);
        
        if (!saved) {
          throw new Error('Offline-Beschwerde konnte nicht gespeichert werden');
        }
        
        return { success: true };
      }
      
      // Online-Anfrage direkt abschicken
      const { error } = await apiService.executeRequest(
        'store-contact-request',
        'invoke',
        requestData,
        {
          showToast: true,
          customSuccessMessage: 'Ihre Beschwerde wurde erfolgreich übermittelt',
          customErrorMessage: 'Beschwerde konnte nicht verarbeitet werden'
        }
      );
      
      if (error) {
        throw error;
      }
      
      // Cache invalidieren
      cacheService.invalidatePattern('contact');
      
      return { success: true };
    } catch (error: any) {
      console.error('Fehler beim Speichern der Beschwerde:', error);
      return { 
        success: false,
        error: error 
      };
    }
  }
}

export const contactService = new ContactService();
