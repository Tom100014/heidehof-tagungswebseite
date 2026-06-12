// @ts-nocheck

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrderStatus = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleDeleteOrder = async (orderId: string, department?: string) => {
    if (!orderId) {
      toast({
        title: "Fehler",
        description: "Bestellungs-ID fehlt",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log(`Lösche Bestellung ${orderId} aus Department: ${department}`);
      
      // Bestimme die richtige Tabelle basierend auf dem Department
      if (department === 'restaurant' || department === 'restaurant_maxwell') {
        const { error } = await supabase
          .from('restaurant_orders')
          .delete()
          .eq('id', orderId);
        if (error) throw error;
      } else if (department === 'bar_max') {
        const { error } = await supabase
          .from('restaurant_orders')
          .delete()
          .eq('id', orderId);
        if (error) throw error;
      } else if (department === 'beauty' || department === 'beauty_treatment') {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', orderId);
        if (error) throw error;
      } else {
        // Für room_service Orders müssen wir zuerst die order_items löschen
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId);
        
        if (itemsError) {
          console.warn('Warnung beim Löschen der Order Items:', itemsError);
        }
        
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) throw error;
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: "Die Bestellung wurde erfolgreich entfernt.",
      });

      // Triggere einen Reload der Seite
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Fehler beim Löschen",
        description: "Die Bestellung konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string, 
    status: string, 
    department: 'room_service' | 'restaurant' | 'beauty'
  ): Promise<boolean> => {
    if (!orderId) {
      toast({
        title: "Fehler",
        description: "Bestellungs-ID fehlt",
        variant: "destructive"
      });
      return false;
    }

    setIsUpdating(true);
    
    try {
      console.log(`Aktualisiere Status für ${orderId} auf ${status} in ${department}`);
      
      let table = 'orders';
      if (department === 'restaurant') table = 'restaurant_orders';
      if (department === 'beauty') table = 'appointments';
      
      const { error } = await supabase
        .from(table as any)
        .update({ status })
        .eq('id', orderId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Der Status konnte nicht geändert werden.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateOrderPriority = async (
    orderId: string, 
    priority: boolean, 
    department?: string
  ): Promise<boolean> => {
    if (!orderId) {
      toast({
        title: "Fehler",
        description: "Bestellungs-ID fehlt",
        variant: "destructive"
      });
      return false;
    }

    setIsUpdating(true);
    
    try {
      console.log(`Aktualisiere Priorität für ${orderId} auf ${priority} in ${department}`);
      
      let table = 'orders';
      if (department === 'restaurant' || department === 'restaurant_maxwell' || department === 'bar_max') {
        table = 'restaurant_orders';
      }
      if (department === 'beauty' || department === 'beauty_treatment') {
        table = 'appointments';
      }
      
      const { error } = await supabase
        .from(table as any)
        .update({ priority })
        .eq('id', orderId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating order priority:', error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Die Priorität konnte nicht geändert werden.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    handleDeleteOrder,
    handleUpdateOrderStatus,
    handleUpdateOrderPriority,
    isDeleting,
    isUpdating
  };
};
