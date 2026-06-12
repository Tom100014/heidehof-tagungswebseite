// @ts-nocheck

import { supabase } from "@/integrations/supabase/client";

export class APILoggerService {
  async logRequest(endpoint: string, requestData: any): Promise<void> {
    try {
      await supabase.from('api_logs').insert({
        endpoint,
        request_data: requestData,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error logging API request:", error);
    }
  }

  async logResponse(
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
      console.error("Error logging API response:", error);
    }
  }
}

export const apiLogger = new APILoggerService();
