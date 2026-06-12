// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AdminNotificationBadgeProps {
  className?: string;
}

const AdminNotificationBadge: React.FC<AdminNotificationBadgeProps> = ({
  className
}) => {
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchComplaintsCount = async () => {
    try {
      console.log('Lade Beschwerden-Anzahl...');
      
      // Zähle nur echte Beschwerden aus contact_requests
      const { count: contactCount, error: contactError } = await supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'neu');

      if (contactError && !contactError.message.includes('relation "contact_requests" does not exist')) {
        console.error('Fehler beim Laden der contact_requests:', contactError);
      }

      const totalCount = contactCount || 0;
      
      console.log('Beschwerden-Zählung:', {
        contactCount: contactCount || 0,
        totalCount
      });
      
      setNewComplaintsCount(totalCount);
      
    } catch (error) {
      console.error('Fehler beim Laden der Beschwerden:', error);
      setNewComplaintsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsCount();

    // Echtzeit-Updates nur für contact_requests
    const contactChannel = supabase
      .channel(`contact_requests_badge_updates-${crypto.randomUUID()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_requests'
      }, (payload) => {
        console.log('Contact requests updated:', payload);
        fetchComplaintsCount();
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(contactChannel);
    };
  }, []);

  const hasNewComplaints = newComplaintsCount > 0;

  if (loading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("relative flex items-center gap-2", className)}
        disabled
      >
        <Bell className="h-4 w-4" />
        <span>Lädt...</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={() => navigate("/admin/requests")}
      variant="outline"
      size="sm"
      className={cn(
        "relative flex items-center gap-2 transition-all",
        hasNewComplaints ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" : "",
        className
      )}
    >
      <Bell className="h-4 w-4" />
      <span>Beschwerden</span>
      {hasNewComplaints && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
          {newComplaintsCount}
        </span>
      )}
    </Button>
  );
};

export default AdminNotificationBadge;
