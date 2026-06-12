import React from 'react';
import { Clock, Users, User, MapPin, Phone, Calendar, Utensils } from 'lucide-react';

interface ReservationMetadata {
  guestCount?: number | string;
  reservationDate?: string;
  reservationTime?: string;
  tablePreference?: string;
  specialRequests?: string;
  occasion?: string;
  allergies?: string;
  notes?: string;
  [key: string]: any;
}

interface ProfessionalReservationReceiptProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: ReservationMetadata;
  };
}

export const ProfessionalReservationReceipt: React.FC<ProfessionalReservationReceiptProps> = ({ order }) => {
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Unbekannte Zeit';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Ungültige Zeit';
    }
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Nicht angegeben';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="font-mono text-sm bg-white border-2 border-orange-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-orange-800 py-4 bg-orange-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Utensils className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold tracking-wider text-orange-900">TISCH-RESERVIERUNG</h2>
        </div>
        <p className="text-xs mt-1 text-gray-600">{order.order_reference || 'Keine Referenz'}</p>
        <p className="text-xs text-gray-600">Gebucht: {formatTimestamp(order.sent_at || order.created_at)}</p>
      </div>
      
      {/* Gast-Informationen */}
      <div className="p-6 space-y-3 border-b border-gray-300">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">GAST:</span>
          <span className="font-bold">{order.customer_name || 'Unbekannt'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">ZIMMER:</span>
          <span className="font-bold">{order.room_number || 'Nicht angegeben'}</span>
        </div>
        {order.recipient_contact && (
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-700">KONTAKT:</span>
            <span className="font-bold text-right">
              {order.recipient_contact}
            </span>
          </div>
        )}
      </div>
      
      {/* Reservierungs-Details */}
      <div className="p-6 bg-orange-50 border-b border-orange-300">
        <h3 className="font-bold text-center mb-4 text-lg border-b border-orange-300 pb-2 text-orange-900">
          RESERVIERUNG
        </h3>
        
        <div className="space-y-4">
          {/* Datum & Uhrzeit */}
          {(order.metadata?.reservationDate || order.metadata?.reservationTime) && (
            <div className="p-4 bg-white rounded border-2 border-orange-300">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-900 uppercase text-xs tracking-wide">
                  Termin
                </span>
              </div>
              <div className="space-y-2">
                {order.metadata.reservationDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Datum:</span>
                    <span className="font-bold">{formatDate(order.metadata.reservationDate)}</span>
                  </div>
                )}
                {order.metadata.reservationTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Uhrzeit:</span>
                    <span className="font-bold">{order.metadata.reservationTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Personenanzahl */}
          {order.metadata?.guestCount && (
            <div className="p-4 bg-blue-50 rounded border border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Personen:</span>
                </div>
                <span className="font-bold text-lg">{order.metadata.guestCount}</span>
              </div>
            </div>
          )}
          
          {/* Tisch-Präferenz */}
          {order.metadata?.tablePreference && (
            <div className="p-3 bg-gray-100 rounded border border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-xs">Tisch-Wunsch:</span>
                <span className="font-bold text-sm">{order.metadata.tablePreference}</span>
              </div>
            </div>
          )}
          
          {/* Anlass */}
          {order.metadata?.occasion && (
            <div className="p-3 bg-pink-50 rounded border border-pink-300">
              <div className="flex justify-between items-center">
                <span className="text-pink-900 text-xs">🎉 Anlass:</span>
                <span className="font-bold text-sm text-pink-900">{order.metadata.occasion}</span>
              </div>
            </div>
          )}
          
          {/* Allergien */}
          {order.metadata?.allergies && (
            <div className="p-3 bg-red-50 rounded border border-red-300">
              <span className="font-semibold text-red-900 text-xs uppercase tracking-wide block mb-1">
                ⚠️ Allergien / Unverträglichkeiten
              </span>
              <div className="text-xs text-red-800 leading-relaxed whitespace-pre-wrap">
                {order.metadata.allergies}
              </div>
            </div>
          )}
          
          {/* Besondere Wünsche */}
          {(order.metadata?.specialRequests || order.metadata?.notes) && (
            <div className="p-3 bg-yellow-50 rounded border border-yellow-300">
              <span className="font-semibold text-yellow-900 text-xs uppercase tracking-wide block mb-1">
                💬 Besondere Wünsche
              </span>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                {order.metadata.specialRequests || order.metadata.notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-3 h-3" />
          <span>Reservierung eingegangen: {formatTimestamp(order.sent_at || order.created_at)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Bitte Tisch reservieren und Gast bestätigen
        </p>
      </div>
    </div>
  );
};
