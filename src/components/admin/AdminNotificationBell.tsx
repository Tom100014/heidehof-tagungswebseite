import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  channel: string;
  content: string;
  status: string;
  recipient: string;
  payload: any;
  created_at: string;
  user_id: string | null;
}

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Eindeutiger Channel-Name pro Mount → verhindert "callbacks after subscribe()" bei StrictMode/HMR
    const channel = supabase
      .channel(`admin-notifications-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => n.status === 'unread').length || 0);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Markieren');
      return;
    }

    fetchNotifications();
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('status', 'unread');

    if (error) {
      toast.error('Fehler beim Markieren');
      return;
    }

    fetchNotifications();
    toast.success('Alle als gelesen markiert');
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'admin': return 'bg-gold/20 text-gold';
      case 'system': return 'bg-blue-500/20 text-blue-400';
      case 'alert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const resolveNotificationTarget = (notif: Notification) => {
    const payload = notif.payload || {};
    const kind = payload.kind || payload.source || payload.raw?.kind || "";
    const content = `${notif.channel} ${notif.recipient} ${notif.content} ${kind}`.toLowerCase();

    if (payload.order_id || content.includes('kitchen') || content.includes('küche') || content.includes('sprach-bestellung')) {
      return `/admin/conference-orders${payload.order_id ? `?order=${encodeURIComponent(payload.order_id)}` : ''}`;
    }
    if (payload.inquiry_id || content.includes('bankett') || content.includes('tagung') || content.includes('seminar')) {
      return `/admin/inbox${payload.inquiry_id ? `?request=${encodeURIComponent(payload.inquiry_id)}` : ''}`;
    }
    if (kind === 'wellness' || content.includes('wellness') || content.includes('spa') || content.includes('beauty')) {
      return '/admin/service?filter=wellness';
    }
    if (kind === 'room_order' || content.includes('zimmer') || content.includes('bar') || content.includes('restaurant')) {
      return '/admin/service';
    }
    if (content.includes('clara')) {
      return '/admin/clara-konversationen';
    }
    return '/admin';
  };

  const openNotification = async (notif: Notification) => {
    if (notif.status === 'unread') {
      await markAsRead(notif.id);
    }
    setOpen(false);
    navigate(resolveNotificationTarget(notif));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gold/10"
        >
          <Bell className="h-5 w-5 text-gold text-slate-500" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-slate-900/95 border-gold/30" align="end">
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h3 className="font-semibold text-gold">Benachrichtigungen</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-gold/70 hover:text-gold"
            >
              Alle gelesen
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="divide-y divide-gold/10">
              {notifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  className={`block w-full p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-inset ${
                    notif.status === 'unread' ? 'bg-gold/5 hover:bg-gold/10' : 'hover:bg-slate-800/50'
                  }`}
                  onClick={() => openNotification(notif)}
                  aria-label={`Benachrichtigung öffnen: ${notif.recipient}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getChannelColor(notif.channel)}`}>
                      {notif.channel.toUpperCase()}
                    </span>
                    {notif.status === 'unread' && (
                      <div className="h-2 w-2 rounded-full bg-gold" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-slate-100 mb-1">
                    {notif.recipient}
                  </h4>
                  <p className="text-xs text-slate-400 mb-2">
                    {notif.content}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(notif.created_at).toLocaleString('de-DE')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationBell;
