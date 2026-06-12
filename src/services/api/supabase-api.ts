// @ts-nocheck

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Zentraler API-Service für alle Supabase-Interaktionen
 * Implementiert eine einheitliche Fehlerbehandlung und Logging
 */
class SupabaseAPIService {
  /**
   * Führt einen API-Aufruf aus mit standardisierter Fehlerbehandlung
   */
  async executeRequest<T>(
    endpoint: string,
    method: string,
    requestData: any,
    options?: {
      showToast?: boolean;
      customErrorMessage?: string;
      customSuccessMessage?: string;
    }
  ): Promise<{ data: T | null; error: Error | null }> {
    const { showToast = true, customErrorMessage, customSuccessMessage } = options || {};
    
    try {
      // Request-Daten für Logging speichern
      await this.logApiRequest(endpoint, requestData);
      
      let response: any;
      
      // Supabase Edge Function aufrufen
      if (method === 'invoke') {
        const { data, error } = await supabase.functions.invoke(endpoint, {
          body: requestData
        });
        
        if (error) throw error;
        response = data;
      } else {
        // Für direkte Datenbank-Operationen (select/insert/update/delete)
        // Use type assertion to fix TypeScript error for dynamic table names
        const query = supabase.from(endpoint as any);
        
        switch (method) {
          case 'select':
            response = await query.select();
            break;
          case 'insert':
            response = await query.insert(requestData);
            break;
          case 'update':
            response = await query.update(requestData).match(requestData.match || {});
            break;
          case 'delete':
            response = await query.delete().match(requestData);
            break;
          default:
            throw new Error(`Unbekannte Methode: ${method}`);
        }
        
        if (response.error) throw response.error;
      }
      
      // Erfolgsantwort loggen
      await this.logApiResponse(endpoint, response, 200);
      
      // Erfolgstoast anzeigen, falls gewünscht
      if (showToast && customSuccessMessage) {
        toast.success(customSuccessMessage);
      }
      
      return { data: response, error: null };
    } catch (error: any) {
      console.error(`Fehler bei API-Aufruf ${endpoint}:`, error);
      
      // Fehler loggen
      await this.logApiResponse(endpoint, null, error.status || 500, error.message);
      
      // Fehlertoast anzeigen, falls gewünscht
      if (showToast) {
        toast.error(customErrorMessage || `Ein Fehler ist aufgetreten: ${error.message}`);
      }
      
      return { data: null, error: error };
    }
  }
  
  /**
   * Loggt einen API-Request in die Datenbank
   */
  private async logApiRequest(endpoint: string, requestData: any): Promise<void> {
    try {
      await supabase.from('api_logs').insert({
        endpoint,
        request_data: requestData,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Fehler beim Loggen des API-Requests:", error);
      // Logging-Fehler werden ignoriert, um den Hauptprozess nicht zu beeinträchtigen
    }
  }
  
  /**
   * Loggt eine API-Antwort in die Datenbank
   */
  private async logApiResponse(
    endpoint: string,
    responseData: any,
    statusCode: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('api_logs').insert({
        endpoint,
        response_data: responseData,
        status_code: statusCode,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Fehler beim Loggen der API-Antwort:", error);
      // Logging-Fehler werden ignoriert, um den Hauptprozess nicht zu beeinträchtigen
    }
  }
  
  /**
   * Speichert Anfragen für die Offline-Nutzung
   */
  async saveOfflineRequest(requestType: string, payload: any): Promise<boolean> {
    try {
      const { error } = await supabase.from('offline_requests').insert({
        request_type: requestType,
        payload,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern der Offline-Anfrage:", error);
      return false;
    }
  }
  
  /**
   * Prüft und sendet ausstehende Offline-Requests
   */
  async processPendingOfflineRequests(): Promise<void> {
    try {
      const { data: pendingRequests, error } = await supabase
        .from('offline_requests')
        .select()
        .eq('status', 'pending');
        
      if (error) throw error;
      
      if (pendingRequests && pendingRequests.length > 0) {
        console.log(`${pendingRequests.length} ausstehende Offline-Anfragen gefunden.`);
        
        for (const request of pendingRequests) {
          try {
            // Edge Function aufrufen
            await this.executeRequest(
              request.request_type,
              'invoke',
              request.payload,
              { showToast: false }
            );
            
            // Request als verarbeitet markieren
            await supabase
              .from('offline_requests')
              .update({
                status: 'processed',
                processed_at: new Date().toISOString()
              })
              .eq('id', request.id);
              
            console.log(`Offline-Anfrage ${request.id} erfolgreich verarbeitet.`);
          } catch (error) {
            console.error(`Fehler bei der Verarbeitung der Offline-Anfrage ${request.id}:`, error);
          }
        }
        
        toast.success(`${pendingRequests.length} Offline-Anfragen wurden synchronisiert`);
      }
    } catch (error) {
      console.error("Fehler bei der Verarbeitung ausstehender Offline-Anfragen:", error);
    }
  }
}

export const apiService = new SupabaseAPIService();
