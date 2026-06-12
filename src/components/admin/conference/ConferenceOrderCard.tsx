// @ts-nocheck

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Building, Clock, Check, X, Trash2, AlertCircle, ChefHat, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConferenceOrderCardProps {
  order: any;
}

export const ConferenceOrderCard: React.FC<ConferenceOrderCardProps> = ({ order }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status || 'new');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
      case 'neu':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
      case 'in_bearbeitung':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
      case 'abgeschlossen':
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
      case 'cancelled':
      case 'storniert':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
      case 'neu':
        return 'Neu';
      case 'processing':
      case 'in_bearbeitung':
        return 'In Bearbeitung';
      case 'completed':
      case 'abgeschlossen':
        return 'Abgeschlossen';
      case 'cancelled':
      case 'storniert':
        return 'Storniert';
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      console.log(`🔄 Updating conference order ${order.id} status to ${newStatus}`);
      
      const { error } = await supabase
        .from('conference_orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) {
        console.error('❌ Error updating conference order status:', error);
        throw error;
      }

      setCurrentStatus(newStatus);
      
      // Erfolgs-Toast mit spezifischen Nachrichten
      const statusMessages = {
        'processing': 'wird bearbeitet',
        'in_bearbeitung': 'wird bearbeitet',
        'completed': 'wurde als abgeschlossen markiert',
        'abgeschlossen': 'wurde als abgeschlossen markiert',
        'cancelled': 'wurde storniert',
        'storniert': 'wurde storniert'
      };
      
      toast.success('Tagungsmenü-Status aktualisiert', {
        description: `Die Bestellung ${statusMessages[newStatus] || 'wurde aktualisiert'}.`
      });
      
    } catch (error) {
      console.error('Error updating conference order status:', error);
      toast.error('Fehler beim Status-Update', {
        description: 'Der Status konnte nicht geändert werden. Bitte versuchen Sie es erneut.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diese Tagungsmenü-Bestellung wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setIsUpdating(true);
    try {
      console.log(`🗑️ Deleting conference order ${order.id}`);
      
      const { error } = await supabase
        .from('conference_orders')
        .delete()
        .eq('id', order.id);

      if (error) {
        console.error('❌ Error deleting conference order:', error);
        throw error;
      }

      toast.success('Tagungsmenü-Bestellung gelöscht', {
        description: 'Die Bestellung wurde erfolgreich entfernt.'
      });
      
      // Trigger refresh - mehrere Methoden für sicheres Update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting conference order:', error);
      toast.error('Fehler beim Löschen', {
        description: 'Die Bestellung konnte nicht gelöscht werden.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Sichere Extraktion der Daten
  const guestInfo = order.guest_info || {};
  const lunchMenu = order.lunch_menu || {};
  const dinnerMenu = order.dinner_menu || {};
  
  // Validierung der essentiellen Daten
  const isValidOrder = order.id && guestInfo && order.order_date;
  
  if (!isValidOrder) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Ungültige Bestelldaten</span>
          </div>
          <p className="text-xs text-red-500 mt-1">
            Diese Bestellung enthält unvollständige Daten und kann nicht angezeigt werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Tagungsmenü
          </CardTitle>
          <Badge className={`${getStatusColor(currentStatus)} font-medium`}>
            {getStatusText(currentStatus)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Gast-Informationen */}
        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {guestInfo.name || 'Unbekannter Gast'}
            </span>
          </div>
          
          {guestInfo.company && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4 text-gray-500" />
              <span>{guestInfo.company}</span>
            </div>
          )}
          
          {guestInfo.conferenceRoom && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Konferenzraum:</span> {guestInfo.conferenceRoom}
            </div>
          )}
          
          {guestInfo.room && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Zimmer:</span> {guestInfo.room}
            </div>
          )}
        </div>

        {/* Datum und Menü-Details */}
        <div className="space-y-3">
          <div className="text-sm bg-blue-50 p-2 rounded">
            <span className="font-medium text-blue-900">Datum:</span> 
            <span className="ml-2 text-blue-800">{formatDate(order.order_date)}</span>
          </div>
          
          {/* Mittagsmenü */}
          {lunchMenu.name && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="h-4 w-4 text-amber-600" />
                <div className="font-medium text-amber-900">Mittagsmenü</div>
              </div>
              <div className="text-sm text-amber-800 font-medium">{lunchMenu.name}</div>
              {lunchMenu.description && (
                <div className="text-xs text-amber-600 mt-1">{lunchMenu.description}</div>
              )}
            </div>
          )}
          
          {/* Abendmenü */}
          {dinnerMenu.name && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-4 w-4 text-blue-600" />
                <div className="font-medium text-blue-900">Abendmenü</div>
              </div>
              <div className="text-sm text-blue-800 font-medium">{dinnerMenu.name}</div>
              {dinnerMenu.description && (
                <div className="text-xs text-blue-600 mt-1">{dinnerMenu.description}</div>
              )}
            </div>
          )}
        </div>

        {/* Zeitstempel */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>Bestellt am {new Date(order.created_at).toLocaleString('de-DE')}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          {currentStatus === 'new' && (
            <Button 
              size="sm" 
              onClick={() => handleStatusUpdate('processing')}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              In Bearbeitung
            </Button>
          )}
          
          {currentStatus === 'processing' && (
            <Button 
              size="sm" 
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className="bg-zinc-600 hover:bg-zinc-700 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              Abschließen
            </Button>
          )}
          
          {currentStatus !== 'cancelled' && currentStatus !== 'completed' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={isUpdating}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Stornieren
            </Button>
          )}

          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isUpdating}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Löschen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
