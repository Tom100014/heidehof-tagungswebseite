
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, User, MapPin, Phone, MessageSquare } from "lucide-react";
import { useOrderStatus } from "@/hooks/use-order-status";
import { RequestCardHeader } from "./requests/RequestCardHeader";
import { RequestCardContent } from "./requests/RequestCardContent";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { ProfessionalOrderReceipt } from "./requests/ProfessionalOrderReceipt";
import { ProfessionalComplaintDisplay } from "./requests/ProfessionalComplaintDisplay";
import { ProfessionalBeautyReceipt } from "./requests/ProfessionalBeautyReceipt";
import { ProfessionalShopReceipt } from "./requests/ProfessionalShopReceipt";
import { ProfessionalReservationReceipt } from "./requests/ProfessionalReservationReceipt";
import { ProfessionalConferenceReceipt } from "./requests/ProfessionalConferenceReceipt";
import { OrderItem, Order } from "@/types/order";
import { formatWhatsAppMessage } from "@/utils/whatsapp-message-formatter";

interface AdminOrderCardProps {
  order: Order;
}

// Minimale Zeit-Formatierung
const formatMinimalTime = (timestamp: string | undefined): string => {
  if (!timestamp) return 'Unbekannt';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Jetzt';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  } catch (error) {
    return 'Ungültig';
  }
};

export const AdminOrderCard: React.FC<AdminOrderCardProps> = ({ order }) => {
  const { handleDeleteOrder, isDeleting } = useOrderStatus();

  // Status-Prüfungen
  const isNew = order.status === 'pending' || order.status === 'offen' || order.status === 'new' || order.status === 'neu';
  const isInProgress = order.status === 'processing' || order.status === 'in_bearbeitung';
  const isCompleted = order.status === 'completed' || order.status === 'abgeschlossen';
  const isHighPriority = order.priority || order.kategorie === 'Essen/Trinken';

  const getDepartmentLabel = () => {
    switch (order.department) {
      case 'restaurant': 
      case 'restaurant_maxwell': 
        return 'Restaurant Maxwell';
      case 'bar_max': 
        return 'Bar Mäx';
      case 'beauty': 
      case 'beauty_treatment': 
        return 'Beauty & Wellness';
      case 'shop': 
        return 'Hotel Shop';
      case 'conference': 
        return 'Konferenz-Service';
      case 'contact': 
        return 'Kontakt-Anfrage';
      case 'room_service': 
        return 'Room Service';
      default: 
        return order.kategorie || 'Service';
    }
  };

  const getDepartmentBadgeColor = () => {
    switch (order.department) {
      case 'restaurant':
      case 'restaurant_maxwell':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'bar_max':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'beauty':
      case 'beauty_treatment':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'shop':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'conference':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'contact':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'room_service':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatItemsForDisplay = (): OrderItem[] => {
    if (typeof order.items === 'string') {
      return [{
        id: 'string-item',
        name: order.items,
        quantity: 1
      }];
    }
    return order.items || [];
  };

  const displayItems = formatItemsForDisplay();

  const handleDelete = () => {
    if (window.confirm('Möchten Sie diese Bestellung wirklich löschen?')) {
      handleDeleteOrder(order.id, order.department);
    }
  };

  const minimalTime = formatMinimalTime(order.timestamp || order.created_at);
  const whatsAppMessage = formatWhatsAppMessage(order);
  const departmentLabel = getDepartmentLabel();

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
      isHighPriority ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
    }`}>
      {/* Header */}
      <RequestCardHeader
        order={order}
        isNew={isNew}
        isInProgress={isInProgress}
        isCompleted={isCompleted}
        isHighPriority={isHighPriority}
        getDepartmentLabel={getDepartmentLabel}
        getDepartmentBadgeColor={getDepartmentBadgeColor}
      />

      {/* Content - Use Professional Displays based on department/type */}
      {(() => {
        const sharedOrderData = {
          order_reference: order.id,
          sent_at: order.timestamp || order.created_at,
          customer_name: order.customer_name,
          room_number: order.room_number?.toString(),
          recipient_contact: order.contact_value,
          status: order.status,
          priority: order.priority
        };

        // Bar Mäx & Restaurant Orders
        if (order.department === 'bar_max' || order.department === 'restaurant' || order.department === 'restaurant_maxwell') {
          return (
            <div className="p-4">
              <ProfessionalOrderReceipt
                order={{
                  ...sharedOrderData,
                  metadata: {
                    items: displayItems as any,
                    totalAmount: order.total_amount?.toString(),
                    deliveryLocation: order.delivery_location
                  },
                  message_type: order.department === 'bar_max' ? 'bar_max_order' : 'restaurant_order'
                }}
                includeRecipes={true}
              />
            </div>
          );
        }

        // Contact & Complaints
        if (order.department === 'contact' || order.kategorie === 'Beschwerde' || order.kategorie === 'Kontakt') {
          return (
            <div className="p-4">
              <ProfessionalComplaintDisplay
                order={{
                  ...sharedOrderData,
                  metadata: {
                    category: order.kategorie || order.complaint_type,
                    complaintText: order.complaint_message || order.notes,
                    priority: order.priority ? 'high' : 'normal',
                    deliveryLocation: order.delivery_location
                  }
                }}
              />
            </div>
          );
        }

        // Beauty Appointments
        if (order.department === 'beauty' || order.department === 'beauty_treatment') {
          const firstItem = Array.isArray(order.items) && order.items.length > 0 
            ? order.items[0] 
            : null;
          
          return (
            <div className="p-4">
              <ProfessionalBeautyReceipt
                order={{
                  ...sharedOrderData,
                  metadata: {
                    treatmentName: order.treatment_name || (firstItem && typeof firstItem === 'object' ? firstItem.name : undefined),
                    appointmentDate: order.appointment_date,
                    appointmentTime: order.exact_time || order.time_preference,
                    duration: order.duration_minutes ? `${order.duration_minutes} Min.` : undefined,
                    notes: order.notes || order.special_requests
                  }
                }}
              />
            </div>
          );
        }

        // Shop Orders
        if (order.department === 'shop') {
          return (
            <div className="p-4">
              <ProfessionalShopReceipt
                order={{
                  ...sharedOrderData,
                  metadata: {
                    items: order.shop_items || displayItems,
                    totalAmount: order.total_amount?.toString(),
                    deliveryLocation: order.delivery_location,
                    deliveryMethod: order.pickup_method,
                    notes: order.notes
                  }
                }}
              />
            </div>
          );
        }

        // Table Reservations
        if (order.department === 'restaurant' && order.kategorie === 'Tischreservierung') {
          return (
            <div className="p-4">
              <ProfessionalReservationReceipt
                order={{
                  ...sharedOrderData,
                  metadata: {
                    guestCount: order.guest_count,
                    reservationDate: order.appointment_date,
                    reservationTime: order.exact_time || order.time_preference,
                    tablePreference: order.table_number,
                    specialRequests: order.special_requests || order.notes,
                    allergies: order.dietary_restrictions
                  }
                }}
              />
            </div>
          );
        }

        // Conference Orders
        if (order.department === 'conference') {
          return (
            <div className="p-4">
              <ProfessionalConferenceReceipt
                order={{
                  ...sharedOrderData,
                  metadata: {
                    eventName: order.conference_room,
                    participantCount: order.group_size || order.guest_count,
                    eventDate: order.order_date || order.appointment_date,
                    menuType: order.meal_type,
                    lunchSelection: order.lunch_menu,
                    dinnerSelection: order.dinner_menu,
                    specialRequirements: order.special_requests || order.notes
                  }
                }}
              />
            </div>
          );
        }

        // Fallback: Standard RequestCardContent
        return (
          <RequestCardContent
            items={displayItems}
            totalAmount={order.total_amount}
            isNew={isNew}
            notes={order.notes}
            appointmentDate={order.appointment_date}
            contactValue={order.contact_value}
            department={order.department}
            kategorie={order.kategorie}
            customerName={order.customer_name || 'Unbekannter Kunde'}
            roomNumber={order.room_number}
            timestamp={order.timestamp}
            deliveryLocation={order.delivery_location}
            guestCount={order.guest_count}
            orderId={order.id}
            orderStatus={order.status}
            priority={order.priority}
            tableNumber={order.table_number}
          />
        );
      })()}

      {/* WhatsApp Message Preview */}
      <WhatsAppPreview 
        title={`WhatsApp-Nachricht für ${departmentLabel}`}
        message={whatsAppMessage}
        className="mx-4 mb-4"
      />

      {/* Actions - KOMPAKTE Zeit-Anzeige */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {minimalTime}
            </span>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { Order } from "@/types/order";
