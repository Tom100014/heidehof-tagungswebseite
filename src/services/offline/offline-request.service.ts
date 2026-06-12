// @ts-nocheck

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class OfflineRequestService {
  async saveRequest(requestType: string, payload: any): Promise<boolean> {
    try {
      const { error } = await supabase.from('offline_requests').insert({
        request_type: requestType,
        payload,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving offline request:", error);
      return false;
    }
  }

  async processPendingRequests(): Promise<void> {
    try {
      const { data: pendingRequests, error } = await supabase
        .from('offline_requests')
        .select()
        .eq('status', 'pending');
        
      if (error) throw error;
      
      if (pendingRequests?.length) {
        console.log(`${pendingRequests.length} pending offline requests found.`);
        
        for (const request of pendingRequests) {
          await this.processRequest(request);
        }
        
        toast.success(`${pendingRequests.length} offline requests synchronized`);
      }
    } catch (error) {
      console.error("Error processing pending offline requests:", error);
    }
  }

  private async processRequest(request: any): Promise<void> {
    try {
      await supabase
        .from('offline_requests')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', request.id);
        
      console.log(`Offline request ${request.id} processed successfully.`);
    } catch (error) {
      console.error(`Error processing offline request ${request.id}:`, error);
    }
  }
}

export const offlineRequestService = new OfflineRequestService();
