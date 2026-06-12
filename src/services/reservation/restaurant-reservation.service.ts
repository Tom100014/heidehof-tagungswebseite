// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { RestaurantReservation, RestaurantMenu } from "./types";
import { toast } from "sonner";

class RestaurantReservationService {
  async createReservation(reservationData: RestaurantReservation): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      console.log("Creating restaurant reservation:", reservationData);
      
      // Validate data
      if (!reservationData.full_name || !reservationData.room_number || !reservationData.reservation_time) {
        throw new Error("Missing required fields");
      }
      
      // Save reservation to Supabase
      const { data: reservation, error } = await supabase
        .from('table_reservations')
        .insert({
          name: reservationData.full_name,
          room_number: reservationData.room_number,
          guest_type: reservationData.room_number ? 'hotel_guest' : 'external_guest',
          reservation_date: reservationData.reservation_date ? reservationData.reservation_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reservation_time: reservationData.reservation_time,
          person_count: parseInt(reservationData.person_count) || 2,
          contact_method: reservationData.contact_method,
          contact_value: reservationData.contact_value,
          special_requests: null,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating reservation:", error);
        throw error;
      }
      
      console.log("Reservation created successfully:", reservation);
      return {
        success: true,
        reservationId: reservation.id
      };
    } catch (error: any) {
      console.error("Failed to create reservation:", error);
      return {
        success: false,
        error: error.message || "Failed to create reservation"
      };
    }
  }

  async getAvailableTimeSlots(date: Date): Promise<string[]> {
    // Default available time slots (18:00 to 20:00, every 30 minutes)
    const defaultTimeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00'];
    
    try {
      // Get existing reservations for the date
      const { data: reservations, error } = await supabase
        .from('table_reservations')
        .select('reservation_time')
        .eq('reservation_date', date.toISOString().split('T')[0])
        .eq('status', 'confirmed');
      
      if (error) {
        console.error("Error fetching reservations:", error);
        return defaultTimeSlots;
      }
      
      // In a real application, you would filter out fully booked time slots
      // For now, we'll return all time slots
      return defaultTimeSlots;
    } catch (error) {
      console.error("Failed to get available time slots:", error);
      return defaultTimeSlots;
    }
  }

  async getActiveMenu(language: string = 'de'): Promise<RestaurantMenu | null> {
    try {
      const { data, error } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('language', language)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error fetching menu:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Failed to get active menu:", error);
      return null;
    }
  }

  async saveMenu(pdfUrl: string, language: string = 'de'): Promise<boolean> {
    try {
      // Deactivate all existing menus for this language
      await supabase
        .from('restaurant_menus')
        .update({ is_active: false })
        .eq('language', language);
      
      // Create new active menu
      const { error } = await supabase
        .from('restaurant_menus')
        .insert({
          language,
          pdf_url: pdfUrl,
          is_active: true
        });
        
      if (error) {
        console.error("Error saving menu:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to save menu:", error);
      return false;
    }
  }

  async deleteMenu(id: string): Promise<boolean> {
    try {
      const { data: menu } = await supabase
        .from('restaurant_menus')
        .select('pdf_url')
        .eq('id', id)
        .single();
        
      if (menu?.pdf_url) {
        // Try to remove the file from storage
        try {
          const url = new URL(menu.pdf_url);
          const pathArray = url.pathname.split('/');
          const filename = pathArray[pathArray.length - 1];
          
          if (filename) {
            await supabase.storage
              .from('hotel-media')
              .remove([`documents/${filename}`]);
          }
        } catch (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue with the database deletion even if storage fails
        }
      }
      
      const { error } = await supabase
        .from('restaurant_menus')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting menu:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete menu:", error);
      return false;
    }
  }
}

export const restaurantReservationService = new RestaurantReservationService();
