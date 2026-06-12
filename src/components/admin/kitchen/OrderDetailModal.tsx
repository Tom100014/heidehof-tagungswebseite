// @ts-nocheck
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Building2, Phone, Mail, Utensils, Fish, Beef, Salad, Printer, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface ConferenceOrder {
  id: string;
  guest_info: any;
  lunch_menu: any;
  dinner_menu?: any;
  order_date: string;
  created_at: string;
  status: string;
  send_method?: string;
  guest_name?: string;
  company?: string;
  conference_room?: string;
}
interface OrderDetailModalProps {
  order: ConferenceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}
const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  if (!order) return null;
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category?.toLowerCase() || '';
    if (lowerCategory.includes('fisch') || lowerCategory.includes('fish')) {
      return <Fish className="w-4 h-4 text-blue-600" />;
    }
    if (lowerCategory.includes('fleisch') || lowerCategory.includes('meat')) {
      return <Beef className="w-4 h-4 text-red-600" />;
    }
    return <Salad className="w-4 h-4 text-zinc-600" />;
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">Neu</Badge>;
      case 'confirmed':
        return <Badge className="bg-zinc-100 text-zinc-800">Bestätigt</Badge>;
      case 'preparing':
        return <Badge className="bg-yellow-100 text-yellow-800">In Vorbereitung</Badge>;
      case 'ready':
        return <Badge className="bg-zinc-100 text-zinc-800">Bereit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('conference_orders').update({
        status: newStatus
      }).eq('id', order.id);
      if (error) throw error;
      onStatusUpdate(order.id, newStatus);
      toast.success(`Status auf "${newStatus}" aktualisiert`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };
  const handlePrintOrder = () => {
    const guestName = order.guest_info?.guestName || order.guest_name || `${order.guest_info?.firstName || ''} ${order.guest_info?.lastName || ''}`.trim() || 'N/A';
    const company = order.guest_info?.company || order.company || 'N/A';
    const conferenceRoom = order.guest_info?.conferenceRoom || order.conference_room || 'N/A';
    const guestType = (() => {
      const type = order.guest_info?.guestType;
      if (type === 'day_guest') return 'Tagungsgast';
      if (type === 'overnight_guest') return 'Tagungsgast + Übernachtung';
      if (type === 'house_guest') return 'Hausgast';
      return type || 'N/A';
    })();
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #333;">Küchenbestellung</h1>
        <hr style="margin: 20px 0;">
        
        <div style="margin-bottom: 20px;">
          <h3>Gast Information</h3>
          <p><strong>Name:</strong> ${guestName}</p>
          <p><strong>Firma:</strong> ${company}</p>
          <p><strong>Tagungsraum:</strong> ${conferenceRoom}</p>
          <p><strong>Gasttyp:</strong> ${guestType}</p>
          <p><strong>Bestelldatum:</strong> ${new Date(order.order_date).toLocaleDateString('de-DE')}</p>
        </div>
        
        ${order.lunch_menu ? `
          <div style="margin-bottom: 20px;">
            <h3>Mittagessen</h3>
            <p><strong>Auswahl:</strong> ${order.lunch_menu.selection}</p>
            <p><strong>Kategorie:</strong> ${order.lunch_menu.category || 'N/A'}</p>
          </div>
        ` : ''}
        
        ${order.dinner_menu ? `
          <div style="margin-bottom: 20px;">
            <h3>Abendessen</h3>
            <p><strong>Auswahl:</strong> ${order.dinner_menu.selection}</p>
            <p><strong>Kategorie:</strong> ${order.dinner_menu.category || 'N/A'}</p>
          </div>
        ` : ''}
        
        <hr style="margin: 20px 0;">
        <p style="text-align: center; color: #666; font-size: 12px;">
          Gedruckt am ${new Date().toLocaleString('de-DE')}
        </p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  const copyOrderDetails = () => {
    const guestName = order.guest_info?.guestName || order.guest_name || `${order.guest_info?.firstName || ''} ${order.guest_info?.lastName || ''}`.trim() || 'N/A';
    const company = order.guest_info?.company || order.company || 'N/A';
    const conferenceRoom = order.guest_info?.conferenceRoom || order.conference_room || 'N/A';
    const orderText = `
Bestellung - ${guestName}
Firma: ${company}
Tagungsraum: ${conferenceRoom}
Datum: ${new Date(order.order_date).toLocaleDateString('de-DE')}

${order.lunch_menu ? `Mittag: ${order.lunch_menu.selection}` : ''}
${order.dinner_menu ? `Abend: ${order.dinner_menu.selection}` : ''}
    `.trim();
    navigator.clipboard.writeText(orderText);
    toast.success('Bestelldetails kopiert');
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bestelldetails</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gast Information */}
          <div className="rounded-lg p-4 bg-slate-950">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Gast Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">
                  {order.guest_info?.guestName || order.guest_name || `${order.guest_info?.firstName || ''} ${order.guest_info?.lastName || ''}`.trim() || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Firma:</span>
                <p className="font-medium">{order.guest_info?.company || order.company || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Tagungsraum:</span>
                <p className="font-medium flex items-center">
                  <Building2 className="w-3 h-3 mr-1" />
                  {order.guest_info?.conferenceRoom || order.conference_room || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Gasttyp:</span>
                <p className="font-medium">
                  {(() => {
                  const guestType = order.guest_info?.guestType;
                  if (guestType === 'day_guest') return 'Tagungsgast';
                  if (guestType === 'overnight_guest') return 'Tagungsgast + Übernachtung';
                  if (guestType === 'house_guest') return 'Hausgast';
                  return guestType || 'N/A';
                })()}
                </p>
              </div>
            </div>
          </div>

          {/* Bestellinformationen */}
          <div className="rounded-lg p-4 bg-slate-950">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Bestellinformationen
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Bestelldatum:</span>
                <p className="font-medium">{new Date(order.order_date).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <span className="text-gray-500">Erstellt am:</span>
                <p className="font-medium flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(order.created_at).toLocaleString('de-DE')}
                </p>
              </div>
              {order.send_method && <div>
                  <span className="text-gray-500">Versandmethode:</span>
                  <Badge variant="outline" className="ml-2">{order.send_method}</Badge>
                </div>}
            </div>
          </div>

          {/* Menü Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Utensils className="w-4 h-4 mr-2" />
              Menü Auswahl
            </h3>

            {order.lunch_menu && <div className="rounded-lg p-4 border border-orange-200 bg-slate-950">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-orange-900">Mittagessen</h4>
                  {getCategoryIcon(order.lunch_menu.category || order.lunch_menu.selection)}
                </div>
                <p className="text-sm text-orange-800">{order.lunch_menu.selection}</p>
                {order.lunch_menu.category && <Badge variant="outline" className="mt-2 text-orange-700 border-orange-300">
                    {order.lunch_menu.category}
                  </Badge>}
              </div>}

            {order.dinner_menu && <div className="rounded-lg p-4 border border-purple-200 bg-gray-950">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900">Abendessen</h4>
                  {getCategoryIcon(order.dinner_menu.category || order.dinner_menu.selection)}
                </div>
                <p className="text-sm text-purple-800">{order.dinner_menu.selection}</p>
                {order.dinner_menu.category && <Badge variant="outline" className="mt-2 text-purple-700 border-purple-300">
                    {order.dinner_menu.category}
                  </Badge>}
              </div>}
          </div>

          <Separator />

          {/* Status Update Buttons */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Status aktualisieren</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant={order.status === 'confirmed' ? 'default' : 'outline'} size="sm" onClick={() => handleStatusUpdate('confirmed')} className="bg-zinc-600 hover:bg-zinc-700 text-white">
                Bestätigt
              </Button>
              <Button variant={order.status === 'preparing' ? 'default' : 'outline'} size="sm" onClick={() => handleStatusUpdate('preparing')} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                In Vorbereitung
              </Button>
              <Button variant={order.status === 'ready' ? 'default' : 'outline'} size="sm" onClick={() => handleStatusUpdate('ready')} className="bg-zinc-600 hover:bg-zinc-700 text-white">
                Bereit
              </Button>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrintOrder}>
                <Printer className="w-4 h-4 mr-2" />
                Drucken
              </Button>
              <Button variant="outline" size="sm" onClick={copyOrderDetails}>
                <Copy className="w-4 h-4 mr-2" />
                Kopieren
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default OrderDetailModal;