import React from 'react';
import { Clock, Users, User, MapPin, Phone, Calendar, Briefcase } from 'lucide-react';

interface ConferenceMetadata {
  eventName?: string;
  participantCount?: number | string;
  eventDate?: string;
  menuType?: string;
  lunchSelection?: any;
  dinnerSelection?: any;
  specialRequirements?: string;
  notes?: string;
  [key: string]: any;
}

interface ProfessionalConferenceReceiptProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: ConferenceMetadata;
  };
}

export const ProfessionalConferenceReceipt: React.FC<ProfessionalConferenceReceiptProps> = ({ order }) => {
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
    <div className="font-mono text-sm bg-white border-2 border-blue-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-blue-800 py-4 bg-blue-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold tracking-wider text-blue-900">KONFERENZ-BESTELLUNG</h2>
        </div>
        <p className="text-xs mt-1 text-gray-600">{order.order_reference || 'Keine Referenz'}</p>
        <p className="text-xs text-gray-600">Gebucht: {formatTimestamp(order.sent_at || order.created_at)}</p>
      </div>
      
      {/* Event & Gast-Informationen */}
      <div className="p-6 space-y-3 border-b border-gray-300">
        {order.metadata?.eventName && (
          <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
            <span className="font-semibold text-gray-700">EVENT:</span>
            <span className="font-bold text-right max-w-[200px]">{order.metadata.eventName}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">VERANSTALTER:</span>
          <span className="font-bold">{order.customer_name || 'Unbekannt'}</span>
        </div>
        {order.metadata?.participantCount && (
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">TEILNEHMER:</span>
            <span className="font-bold text-lg">{order.metadata.participantCount} Personen</span>
          </div>
        )}
        {order.recipient_contact && (
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-700">KONTAKT:</span>
            <span className="font-bold text-right">
              {order.recipient_contact}
            </span>
          </div>
        )}
      </div>
      
      {/* Event-Details */}
      <div className="p-6 bg-blue-50 border-b border-blue-300">
        <h3 className="font-bold text-center mb-4 text-lg border-b border-blue-300 pb-2 text-blue-900">
          VERANSTALTUNG
        </h3>
        
        <div className="space-y-4">
          {/* Event-Datum */}
          {order.metadata?.eventDate && (
            <div className="p-4 bg-white rounded border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900 uppercase text-xs tracking-wide">
                  Datum
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Event-Datum:</span>
                <span className="font-bold">{formatDate(order.metadata.eventDate)}</span>
              </div>
            </div>
          )}
          
          {/* Menü-Auswahl */}
          {(order.metadata?.menuType || order.metadata?.lunchSelection || order.metadata?.dinnerSelection) && (
            <div className="p-4 bg-zinc-50 rounded border border-zinc-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-zinc-900 uppercase text-xs tracking-wide">
                  🍽️ Menü-Auswahl
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {order.metadata.menuType && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Menü-Typ:</span>
                    <span className="font-bold">{order.metadata.menuType}</span>
                  </div>
                )}
                {order.metadata.lunchSelection && (
                  <div className="mt-2 p-2 bg-white rounded border border-zinc-200">
                    <span className="font-semibold text-zinc-900 block mb-1">Lunch:</span>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {typeof order.metadata.lunchSelection === 'object' 
                        ? JSON.stringify(order.metadata.lunchSelection, null, 2)
                        : order.metadata.lunchSelection}
                    </div>
                  </div>
                )}
                {order.metadata.dinnerSelection && (
                  <div className="mt-2 p-2 bg-white rounded border border-zinc-200">
                    <span className="font-semibold text-zinc-900 block mb-1">Dinner:</span>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {typeof order.metadata.dinnerSelection === 'object'
                        ? JSON.stringify(order.metadata.dinnerSelection, null, 2)
                        : order.metadata.dinnerSelection}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Besondere Anforderungen */}
          {(order.metadata?.specialRequirements || order.metadata?.notes) && (
            <div className="p-3 bg-yellow-50 rounded border border-yellow-300">
              <span className="font-semibold text-yellow-900 text-xs uppercase tracking-wide block mb-1">
                💬 Besondere Anforderungen
              </span>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                {order.metadata.specialRequirements || order.metadata.notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-3 h-3" />
          <span>Anfrage eingegangen: {formatTimestamp(order.sent_at || order.created_at)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Bitte Angebot erstellen und mit Veranstalter abstimmen
        </p>
      </div>
    </div>
  );
};
