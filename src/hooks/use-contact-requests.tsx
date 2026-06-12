// @ts-nocheck

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContactRequest {
  id: string;
  name: string;
  contact_type: string;
  contact_value: string;
  service_context: any;
  room_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
  allow_future_contact?: boolean;
}

export const useContactRequests = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<ContactRequest[]>([]);

  const fetchRequests = async () => {
    console.log("🔄 Lade Beschwerden aus der Datenbank...");
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log("📊 Supabase Contact Requests - Error:", error);
      console.log("📊 Supabase Contact Requests - Data:", data);
      
      if (error) {
        console.error("❌ Fehler beim Laden der Beschwerden:", error);
        toast({
          title: "Datenbankfehler",
          description: `Fehler beim Laden: ${error.message}`,
          variant: "destructive"
        });
        setRequests([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("ℹ️ Keine Beschwerden in der Datenbank gefunden");
        setRequests([]);
        return;
      }
      
      console.log(`✅ ${data.length} Beschwerden erfolgreich geladen:`, data);
      setRequests(data);
      
      // Erfolgreiche Meldung nur wenn Daten vorhanden sind
      toast({
        title: "Beschwerden geladen",
        description: `${data.length} Beschwerden wurden erfolgreich geladen.`,
        duration: 3000
      });
      
    } catch (error) {
      console.error("❌ Unerwarteter Fehler beim Laden der Kontaktanfragen:", error);
      toast({
        title: "Fehler",
        description: "Die Beschwerden konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      console.log(`🔄 Aktualisiere Status für Request ${requestId} auf ${status}`);
      
      const { error } = await supabase
        .from('contact_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (error) {
        console.error("❌ Fehler beim Status-Update:", error);
        throw error;
      }
      
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status, updated_at: new Date().toISOString() } : r)
      );
      
      const statusMessage = 
        status === "in_bearbeitung" ? "in Bearbeitung" : 
        status === "beantwortet" ? "beantwortet" : 
        status === "geschlossen" ? "geschlossen" :
        "neu";
        
      toast({
        title: "Status aktualisiert",
        description: `Die Beschwerde wurde als ${statusMessage} markiert.`
      });
      
    } catch (error) {
      console.error("❌ Fehler beim Status-Update:", error);
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      console.log(`🗑️ Lösche Request ${requestId}`);
      
      const { error } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', requestId);
        
      if (error) {
        console.error("❌ Fehler beim Löschen:", error);
        throw error;
      }
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast({
        title: "Beschwerde gelöscht",
        description: "Die Beschwerde wurde erfolgreich gelöscht."
      });
      
    } catch (error) {
      console.error("❌ Fehler beim Löschen der Request:", error);
      toast({
        title: "Fehler",
        description: "Die Beschwerde konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log("🚀 useContactRequests Hook initialisiert - RLS-Policies sind jetzt aktiv!");
    fetchRequests();

    // Echtzeit-Updates für contact_requests
    const channel = supabase
      .channel('contact_requests_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_requests'
      }, (payload) => {
        console.log('📡 Echtzeit-Update für Contact Requests erhalten:', payload);
        fetchRequests(); // Neu laden bei Änderungen
      })
      .subscribe();

    return () => {
      console.log("🧹 useContactRequests Hook wird bereinigt");
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isLoading,
    requests,
    fetchRequests,
    updateRequestStatus,
    deleteRequest,
    setRequests
  };
};
