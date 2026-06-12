import React from 'react';
import { AlertTriangle, Clock, User, MapPin, Phone, MessageSquare } from 'lucide-react';

interface ComplaintMetadata {
  category?: string;
  complaintText?: string;
  priority?: string;
  customerPhoneNumber?: string;
  deliveryLocation?: string;
  [key: string]: any;
}

interface ProfessionalComplaintDisplayProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: ComplaintMetadata;
    status?: string;
    priority?: boolean;
  };
}

export const ProfessionalComplaintDisplay: React.FC<ProfessionalComplaintDisplayProps> = ({ order }) => {
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

  const getPriorityLabel = () => {
    if (order.priority || order.metadata?.priority === 'high') return 'HOCH';
    if (order.metadata?.priority === 'medium') return 'MITTEL';
    return 'NORMAL';
  };

  const getPriorityColor = () => {
    if (order.priority || order.metadata?.priority === 'high') return 'bg-red-100 text-red-900 border-red-300';
    if (order.metadata?.priority === 'medium') return 'bg-orange-100 text-orange-900 border-orange-300';
    return 'bg-zinc-100 text-zinc-900 border-zinc-300';
  };

  return (
    <div className="font-mono text-sm bg-white border-2 border-gray-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 py-4 bg-red-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold tracking-wider text-red-900">BESCHWERDE / KONTAKT</h2>
        </div>
        <p className="text-xs mt-1 text-gray-600">{order.order_reference || 'Keine Referenz'}</p>
        <p className="text-xs text-gray-600">{formatTimestamp(order.sent_at || order.created_at)}</p>
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
        {order.metadata?.deliveryLocation && (
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-700">ORT:</span>
            <span className="font-bold text-right max-w-[200px]">
              {order.metadata.deliveryLocation}
            </span>
          </div>
        )}
      </div>
      
      {/* Priorität & Kategorie */}
      <div className="p-6 space-y-3 border-b border-gray-300 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">PRIORITÄT:</span>
          <span className={`px-3 py-1 rounded font-bold text-xs border ${getPriorityColor()}`}>
            {getPriorityLabel()}
          </span>
        </div>
        {order.metadata?.category && (
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">KATEGORIE:</span>
            <span className="font-bold">{order.metadata.category}</span>
          </div>
        )}
        {order.status && (
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">STATUS:</span>
            <span className="font-bold uppercase">
              {order.status === 'pending' || order.status === 'offen' ? 'OFFEN' : 
               order.status === 'processing' ? 'IN BEARBEITUNG' : 
               order.status === 'completed' ? 'GELÖST' : order.status}
            </span>
          </div>
        )}
      </div>
      
      {/* Beschwerde-Text */}
      <div className="p-6 bg-yellow-50 border-b-2 border-yellow-300">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-yellow-700" />
          <h3 className="font-bold text-yellow-900 uppercase tracking-wide">
            Nachricht des Gastes
          </h3>
        </div>
        <div className="bg-white p-4 rounded border border-yellow-300 text-gray-800 leading-relaxed whitespace-pre-wrap">
          {order.metadata?.complaintText || order.metadata?.message || 'Keine Nachricht vorhanden'}
        </div>
      </div>
      
      {/* Zeitstempel Footer */}
      <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Eingegangen: {formatTimestamp(order.sent_at || order.created_at)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Bitte zeitnah bearbeiten und professionell beantworten
        </p>
      </div>
    </div>
  );
};
