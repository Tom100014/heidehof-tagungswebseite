import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, User, Clock, AlertTriangle, Bell, VolumeX, Volume2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminMessage {
  id: string;
  message_type: string;
  source_form: string;
  recipient_type: string;
  recipient_contact: string;
  message_content: string;
  customer_name?: string;
  room_number?: string;
  order_reference?: string;
  metadata: any;
  status: string;
  sent_at: string;
  admin_notes?: string;
  priority: boolean;
}

interface AdminMessageModalProps {
  message: AdminMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkComplete: (messageId: string) => void;
  onSnooze: (messageId: string, minutes: number) => void;
}

export function AdminMessageModal({ message, isOpen, onClose, onMarkComplete, onSnooze }: AdminMessageModalProps) {
  const navigate = useNavigate();
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const getMessageTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'restaurant_reservation': 'Restaurant-Reservierung',
      'bar_max_order': 'Bar Mäx Bestellung',
      'conference_order': 'Konferenz-Bestellung',
      'beauty_appointment': 'Beauty-Termin',
      'contact_complaint': 'Beschwerde/Kontakt',
      'Beschwerde/Kontakt': 'Beschwerde/Kontakt',
      'shop_order': 'Shop-Bestellung'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'restaurant_reservation': '🍽️',
      'bar_max_order': '🍹',
      'conference_order': '🏢',
      'beauty_appointment': '💆‍♀️',
      'contact_complaint': '📞',
      'shop_order': '🛒'
    };
    return icons[type] || '📋';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'table_reservation': 'bg-blue-900/30 border-blue-500/50 text-blue-200',
      'bar_max_order': 'bg-purple-900/30 border-purple-500/50 text-purple-200',
      'restaurant_order': 'bg-zinc-900/30 border-zinc-500/50 text-zinc-200',
      'beauty_appointment': 'bg-pink-900/30 border-pink-500/50 text-pink-200',
      'contact_request': 'bg-amber-900/30 border-amber-500/50 text-amber-200',
      'complaint': 'bg-red-900/30 border-red-500/50 text-red-200'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-900/30 border-slate-500/50 text-slate-200';
  };

  const getAdminRouteForMessage = (message: AdminMessage) => {
    const routes: Record<string, string> = {
      restaurant_reservation: '/admin/service',
      table_reservation: '/admin/service',
      bar_max_order: '/admin/service',
      conference_order: '/admin/conference-orders',
      beauty_appointment: '/admin/service?filter=wellness',
      contact_complaint: '/admin/service',
      'Beschwerde/Kontakt': '/admin/service',
      shop_order: '/admin/service',
    };
    return routes[message.message_type] || '/admin/inbox';
  };

  const getPriorityColor = (priority: boolean) => {
    return priority ? 'bg-red-500/20 border-red-500' : 'bg-slate-800/50 border-slate-600';
  };

  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }
  };

  const playEscalationSound = (level: number) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Progressive sound escalation
    const frequencies = [800, 1000, 1200, 1400];
    const durations = [200, 300, 500, 800];
    
    oscillator.frequency.value = frequencies[Math.min(level, 3)];
    oscillator.type = level > 2 ? 'square' : 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durations[Math.min(level, 3)] / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durations[Math.min(level, 3)] / 1000);
  };

  const startEscalation = () => {
    if (!message) return;
    
    initAudio();
    setIsPlaying(true);
    
    const escalateTimer = setInterval(() => {
      setEscalationLevel(prev => {
        const newLevel = prev + 1;
        playEscalationSound(newLevel);
        
        // Maximale Eskalation nach 4 Stufen
        if (newLevel >= 4) {
          clearInterval(escalateTimer);
          // Kontinuierliche Wiederholung bei höchster Stufe
          const repeatTimer = setInterval(() => {
            playEscalationSound(3);
          }, 2000);
          
          // Nach 2 Minuten stoppen
          setTimeout(() => {
            clearInterval(repeatTimer);
            setIsPlaying(false);
          }, 120000);
        }
        
        return newLevel;
      });
    }, 15000); // Alle 15 Sekunden eskalieren

    // Sofort ersten Sound spielen
    playEscalationSound(0);
  };

  const stopEscalation = () => {
    setIsPlaying(false);
    setEscalationLevel(0);
  };

  useEffect(() => {
    if (isOpen && message) {
      // Sofort beim Öffnen Eskalation starten
      startEscalation();
      
      // Vibration für mobile Geräte
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    } else {
      stopEscalation();
    }

    return () => {
      stopEscalation();
    };
  }, [isOpen, message]);

  const handleComplete = () => {
    if (message) {
      onMarkComplete(message.id);
      stopEscalation();
      onClose();
    }
  };

  const handleSnooze = (minutes: number) => {
    if (message) {
      onSnooze(message.id, minutes);
      stopEscalation();
      onClose();
    }
  };

  if (!message) return null;

  const isHighPriority = message.priority || message.message_type === 'complaint';
  const messageAge = new Date().getTime() - new Date(message.sent_at).getTime();
  const isOld = messageAge > 30 * 60 * 1000; // Älter als 30 Minuten

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {getTypeIcon(message.message_type)}
            <span>Neue Nachricht</span>
            {message.priority && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3" />
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Compact Info */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {message.customer_name || 'Unbekannt'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getMessageTypeLabel(message.message_type)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(message.sent_at).toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.sent_at).toLocaleDateString('de-DE', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                navigate(getAdminRouteForMessage(message));
                onClose();
              }}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ansehen
            </Button>
            
            <Button
              onClick={handleComplete}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Erledigt
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Clock className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSnooze(5)}>
                  5 Min
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(15)}>
                  15 Min
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(30)}>
                  30 Min
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
