import React from 'react';
import { Clock, Sparkles, User, MapPin, Phone, Calendar } from 'lucide-react';

interface BeautyMetadata {
  treatmentName?: string;
  treatmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: string;
  notes?: string;
  specialRequests?: string;
  [key: string]: any;
}

interface ProfessionalBeautyReceiptProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: BeautyMetadata;
  };
}

export const ProfessionalBeautyReceipt: React.FC<ProfessionalBeautyReceiptProps> = ({ order }) => {
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
    <div className="font-mono text-sm bg-white border-2 border-purple-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-purple-800 py-4 bg-purple-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold tracking-wider text-purple-900">BEAUTY TERMIN</h2>
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
      
      {/* Treatment Details */}
      <div className="p-6 bg-purple-50 border-b border-purple-300">
        <h3 className="font-bold text-center mb-4 text-lg border-b border-purple-300 pb-2 text-purple-900">
          BEHANDLUNG
        </h3>
        
        <div className="space-y-4">
          {order.metadata?.treatmentName && (
            <div className="p-4 bg-white rounded border-2 border-purple-300">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-900 text-base">
                  {order.metadata.treatmentName}
                </span>
              </div>
              {order.metadata.duration && (
                <div className="flex items-center gap-2 text-xs text-gray-700 mt-2">
                  <Clock className="w-4 h-4" />
                  <span>Dauer: {order.metadata.duration}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Termin-Details */}
          {(order.metadata?.appointmentDate || order.metadata?.appointmentTime) && (
            <div className="p-4 bg-blue-50 rounded border border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900 uppercase text-xs tracking-wide">
                  Termin-Zeitpunkt
                </span>
              </div>
              <div className="space-y-2">
                {order.metadata.appointmentDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Datum:</span>
                    <span className="font-bold">{formatDate(order.metadata.appointmentDate)}</span>
                  </div>
                )}
                {order.metadata.appointmentTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Uhrzeit:</span>
                    <span className="font-bold">{order.metadata.appointmentTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Spezielle Wünsche */}
          {(order.metadata?.notes || order.metadata?.specialRequests) && (
            <div className="p-4 bg-yellow-50 rounded border border-yellow-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-yellow-900 uppercase text-xs tracking-wide">
                  💬 Besondere Wünsche
                </span>
              </div>
              <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                {order.metadata.notes || order.metadata.specialRequests}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-3 h-3" />
          <span>Buchung eingegangen: {formatTimestamp(order.sent_at || order.created_at)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Bitte Termin bestätigen und Gast informieren
        </p>
      </div>
    </div>
  );
};
