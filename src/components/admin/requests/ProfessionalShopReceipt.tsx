import React from 'react';
import { Clock, ShoppingBag, User, MapPin, Phone, Package } from 'lucide-react';

interface ShopItem {
  name: string;
  quantity: number;
  price?: string | number;
  id?: string;
}

interface ShopMetadata {
  items?: ShopItem[];
  totalAmount?: string | number;
  deliveryLocation?: string;
  deliveryMethod?: string;
  notes?: string;
  [key: string]: any;
}

interface ProfessionalShopReceiptProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: ShopMetadata;
  };
}

export const ProfessionalShopReceipt: React.FC<ProfessionalShopReceiptProps> = ({ order }) => {
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

  return (
    <div className="font-mono text-sm bg-white border-2 border-zinc-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-zinc-800 py-4 bg-zinc-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShoppingBag className="w-6 h-6 text-zinc-600" />
          <h2 className="text-xl font-bold tracking-wider text-zinc-900">SHOP BESTELLUNG</h2>
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
        {order.metadata?.deliveryLocation && (
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-700">ZUSTELLUNG:</span>
            <span className="font-bold text-right max-w-[200px]">
              {order.metadata.deliveryLocation}
            </span>
          </div>
        )}
        {order.metadata?.deliveryMethod && (
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">VERSAND:</span>
            <span className="font-bold">{order.metadata.deliveryMethod}</span>
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
      
      {/* Bestellte Produkte */}
      <div className="p-6 space-y-4">
        <h3 className="font-bold text-center mb-4 text-lg border-b border-gray-300 pb-2">
          BESTELLUNG
        </h3>
        
        {order.metadata?.items && order.metadata.items.length > 0 ? (
          <div className="space-y-3">
            {order.metadata.items.map((item, idx) => (
              <div key={idx} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-zinc-600 mt-1" />
                    <div>
                      <span className="font-bold text-base">
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                  </div>
                  {item.price && (
                    <span className="font-bold text-base ml-4">{item.price}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic">Keine Produkte vorhanden</p>
        )}
        
        {/* Notizen */}
        {order.metadata?.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
            <span className="font-semibold text-yellow-900 text-xs uppercase tracking-wide block mb-2">
              💬 Hinweise
            </span>
            <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
              {order.metadata.notes}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t-2 border-gray-400"></div>
      
      {/* Summe */}
      {order.metadata?.totalAmount && (
        <div className="p-6 bg-zinc-100">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>GESAMT:</span>
            <span>{order.metadata.totalAmount}€</span>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300 bg-gray-100">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Bestellung eingegangen: {formatTimestamp(order.sent_at || order.created_at)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Bitte Bestellung vorbereiten und Gast über Abholung/Zustellung informieren
        </p>
      </div>
    </div>
  );
};
