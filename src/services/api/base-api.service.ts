
import { supabase } from "@/integrations/supabase/client";
import { apiLogger } from "../logging/api-logger.service";
import { offlineRequestService } from "../offline/offline-request.service";
import { toast } from "sonner";

export interface APIRequestOptions {
  showToast?: boolean;
  customErrorMessage?: string;
  customSuccessMessage?: string;
}

export class BaseAPIService {
  protected async executeRequest<T>(
    endpoint: string,
    method: string,
    requestData: any,
    options?: APIRequestOptions
  ): Promise<{ data: T | null; error: Error | null }> {
    const { showToast = true, customErrorMessage, customSuccessMessage } = options || {};
    
    try {
      if (!navigator.onLine) {
        const saved = await offlineRequestService.saveRequest(endpoint, requestData);
        if (!saved) {
          throw new Error('Could not save offline request');
        }
        return { data: null, error: null };
      }

      await apiLogger.logRequest(endpoint, requestData);
      
      const response = await this.performDatabaseOperation(method, endpoint, requestData);
      await apiLogger.logResponse(endpoint, response, 200);
      
      if (showToast && customSuccessMessage) {
        toast.success(customSuccessMessage);
      }
      
      return { data: response, error: null };
    } catch (error: any) {
      await apiLogger.logResponse(endpoint, null, error.status || 500, error.message);
      
      if (showToast) {
        toast.error(customErrorMessage || `An error occurred: ${error.message}`);
      }
      
      return { data: null, error };
    }
  }

  private async performDatabaseOperation(method: string, endpoint: string, requestData: any): Promise<any> {
    const query = supabase.from(endpoint as any);
    
    switch (method) {
      case 'select':
        return (await query.select()).data;
      case 'insert':
        return (await query.insert(requestData)).data;
      case 'update':
        return (await query.update(requestData).match(requestData.match || {})).data;
      case 'delete':
        return (await query.delete().match(requestData)).data;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}
