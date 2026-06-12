import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequestCardActions } from '@/components/admin/requests/RequestCardActions';
import { Clock, MapPin, Phone, Mail, Euro, User, MessageSquare, AlertTriangle } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  room_number: string;
  contact_method: string;
  contact_value: string;
  items: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_location: string;
  desired_time: string;
  special_requests?: string;
  allergies?: string;
  order_type: string;
  internal_notes?: string;
}

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onDelete: (orderId: string) => void;
  isLoading?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onDelete,
  isLoading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'neu':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_bearbeitung':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'erledigt':
      case 'completed':
        return 'bg-zinc-100 text-zinc-800';
      case 'storniert':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {order.customer_name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Zimmer: {order.room_number}</span>
              <span>{order.order_type}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <RequestCardActions
              onDelete={() => onDelete(order.id)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Lieferort:</span>
              <span>{order.delivery_location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Gewünschte Zeit:</span>
              <span>{order.desired_time}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {order.contact_method === 'email' ? (
                <Mail className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Phone className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">Kontakt:</span>
              <span>{order.contact_value}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Gesamtbetrag:</span>
              <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium">Status ändern:</span>
              <Select value={order.status} onValueChange={(value) => onStatusUpdate(order.id, value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neu">Neu</SelectItem>
                  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="erledigt">Erledigt</SelectItem>
                  <SelectItem value="storniert">Storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              <div>Erstellt: {formatDateTime(order.created_at)}</div>
              <div>Aktualisiert: {formatDateTime(order.updated_at)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium">Bestellte Artikel:</span>
            <div className="mt-1 p-3 bg-muted rounded-md text-sm">
              {order.items}
            </div>
          </div>

          {order.special_requests && (
            <div>
              <span className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Besondere Wünsche:
              </span>
              <div className="mt-1 p-3 bg-blue-50 rounded-md text-sm">
                {order.special_requests}
              </div>
            </div>
          )}

          {order.allergies && (
            <div>
              <span className="text-sm font-medium flex items-center gap-1 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                Allergien/Unverträglichkeiten:
              </span>
              <div className="mt-1 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm">
                {order.allergies}
              </div>
            </div>
          )}

          {order.internal_notes && (
            <div>
              <span className="text-sm font-medium">Interne Notizen:</span>
              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                {order.internal_notes}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};