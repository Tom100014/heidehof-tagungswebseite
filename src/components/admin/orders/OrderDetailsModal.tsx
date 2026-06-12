import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Order } from '@/types/order';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Utensils, Wine, Scissors, Coffee, Table, Frown, Key, Bed } from "lucide-react";
import { RequestCardContent } from "../requests/RequestCardContent";
import { RestaurantRequestContent } from "../requests/RestaurantRequestContent";
import { BeautyRequestContent } from "../requests/BeautyRequestContent";
import { ConferenceRequestContent } from "../requests/ConferenceRequestContent";
import { parseOrderItems } from "@/types/order";
import { ContactRequestContent } from "../requests/ContactRequestContent";

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRestaurant = order.department === 'restaurant' || order.department === 'restaurant_maxwell';
  const isBeauty = order.department === 'beauty' || order.kategorie === 'Beauty-Behandlung';
  const isShop = order.department === 'shop' || order.kategorie === 'Shop-Bestellung';
  const isConference = order.department === 'conference' || order.kategorie === 'Konferenz-Bestellung';
  const isContact = order.department === 'contact' || order.kategorie === 'Kontakt-Anfrage';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bestelldetails #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Kontakt-/Beschwerde-spezifischer Content */}
          {isContact && (
            <ContactRequestContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              contactMethod={order.contact_method}
              contactType={order.contact_type}
              serviceContext={order.service_context}
              allowFutureContact={order.allow_future_contact}
              complaintMessage={order.complaint_message}
              complaintCategories={order.complaint_categories}
              otherComplaint={order.other_complaint}
              complaintSeverity={order.complaint_severity}
              responseRequired={order.response_required}
            />
          )}

          {/* Konferenz-spezifischer Content */}
          {isConference && (
            <ConferenceRequestContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              conferenceRoom={order.conference_room}
              orderDate={order.order_date}
              sendMethod={order.send_method}
              lunchMenu={order.lunch_menu}
              dinnerMenu={order.dinner_menu}
              guestInfo={order.guest_info}
              menuSelections={order.menu_selections}
              dietaryRestrictions={order.dietary_restrictions}
              specialRequests={order.special_requests}
              mealType={order.meal_type}
              conferenceDay={order.conference_day}
              groupSize={order.group_size}
              contactMethod={order.contact_method}
            />
          )}

          {/* Shop-spezifischer Content */}
          {isShop && (
            <RequestCardContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              isNew={order.status === 'new' || order.status === 'neu'}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              department={order.department}
              kategorie={order.kategorie}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              deliveryLocation={order.delivery_location}
              guestCount={order.guest_count}
              orderId={order.id}
              orderStatus={order.status}
              priority={order.priority}
              tableNumber={order.table_number}
            />
          )}

          {/* Beauty-spezifischer Content */}
          {isBeauty && !isShop && (
            <BeautyRequestContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              treatmentName={order.treatment_name}
              treatmentType={order.treatment_type}
              durationMinutes={order.duration_minutes}
              preferredStaff={order.preferred_staff}
              exactTime={order.exact_time}
              timePreference={order.time_preference}
              contactMethod={order.contact_method}
            />
          )}

          {/* Restaurant-spezifischer Content */}
          {isRestaurant && !isBeauty && !isShop && (
            <RestaurantRequestContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              deliveryLocation={order.delivery_location}
              tableNumber={order.table_number}
              bedNumber={order.bedNumber}
              tentNumber={order.tentNumber}
              specificLocation={order.specificLocation}
            />
          )}

          {/* Standard Content für andere Bestellungstypen */}
          {!isRestaurant && !isBeauty && !isShop && !isConference && !isContact && (
            <RequestCardContent
              items={parseOrderItems(order.items)}
              totalAmount={order.total_amount}
              isNew={order.status === 'new' || order.status === 'neu'}
              notes={order.notes}
              appointmentDate={order.appointment_date}
              contactValue={order.contact_value}
              department={order.department}
              kategorie={order.kategorie}
              customerName={order.customer_name}
              roomNumber={order.room_number}
              timestamp={order.timestamp}
              deliveryLocation={order.delivery_location}
              guestCount={order.guest_count}
              orderId={order.id}
              orderStatus={order.status}
              priority={order.priority}
              tableNumber={order.table_number}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status & Aktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status:</p>
                  <Badge>{order.status}</Badge>
                </div>
                <div>
                  <Button variant="outline" onClick={onClose}>Schließen</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
