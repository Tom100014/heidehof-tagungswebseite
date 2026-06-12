import React from 'react';
import { Clock, Wine, User, MapPin, Phone } from 'lucide-react';
import { calculateTotalPrepTime, calculateDeliveryTime } from '@/utils/delivery-time-calculator';

interface RecipeData {
  ingredients: Array<{ item: string; amount: string }>;
  instructions: string[];
  garnish?: string;
  glass_type?: string;
  difficulty?: string;
}

interface OrderItemWithRecipe {
  name: string;
  quantity: number;
  price?: string;
  notes?: string;
  recipe?: RecipeData;
  preparation_time_minutes?: number;
  allergens?: string[];
}

interface OrderMetadata {
  items?: OrderItemWithRecipe[];
  totalAmount?: string | number;
  deliveryLocation?: string;
}

interface ProfessionalOrderReceiptProps {
  order: {
    order_reference?: string;
    sent_at?: string;
    created_at?: string;
    customer_name?: string;
    room_number?: string;
    recipient_contact?: string;
    metadata?: OrderMetadata;
    message_type?: string;
  };
  includeRecipes?: boolean;
}

export const ProfessionalOrderReceipt: React.FC<ProfessionalOrderReceiptProps> = ({ 
  order, 
  includeRecipes = true 
}) => {
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

  const isBarMaxOrder = order.message_type === 'bar_max_order';
  const isRestaurantOrder = order.message_type === 'restaurant_order';

  return (
    <div className="font-mono text-sm bg-white border-2 border-gray-400 shadow-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 py-4 bg-gray-100">
        <h2 className="text-xl font-bold tracking-wider">BESTELLUNG</h2>
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
        <div className="flex justify-between items-start">
          <span className="font-semibold text-gray-700">ZUSTELLUNG:</span>
          <span className="font-bold text-right max-w-[200px]">
            {order.metadata?.deliveryLocation || 'Nicht angegeben'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">ZEIT:</span>
          <span className="font-bold">Sofort</span>
        </div>
      </div>
      
      {/* Bestellte Items MIT REZEPTEN */}
      <div className="p-6 space-y-4">
        <h3 className="font-bold text-center mb-4 text-lg border-b border-gray-300 pb-2">
          BESTELLUNG
        </h3>
        
        {order.metadata?.items && order.metadata.items.length > 0 ? (
          order.metadata.items.map((item, idx) => (
            <div key={idx} className="mb-6 pb-4 border-b border-gray-200 last:border-0">
              {/* Item Header */}
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-base">
                  {item.quantity}x {item.name}
                </span>
                {item.price && (
                  <span className="font-bold text-base">{item.price}</span>
                )}
              </div>
              
              {/* Rezept Section (NUR wenn includeRecipes=true UND Rezept vorhanden) */}
              {includeRecipes && item.recipe && (isBarMaxOrder || isRestaurantOrder) && (
                <div className="ml-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wine className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-900 text-xs uppercase tracking-wide">
                        Rezept
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {item.recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex justify-between">
                          <span>• {ing.item}</span>
                          <span className="font-semibold ml-4">{ing.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-3">
                    <span className="font-bold text-blue-900 text-xs uppercase tracking-wide block mb-2">
                      🔧 Zubereitung:
                    </span>
                    <ol className="space-y-1 text-xs list-decimal list-inside">
                      {item.recipe.instructions.map((step, i) => (
                        <li key={i} className="text-gray-700">{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-gray-700 pt-2 border-t border-blue-200">
                    {item.preparation_time_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.preparation_time_minutes} Min.
                      </span>
                    )}
                    {item.recipe.glass_type && (
                      <span>🥃 {item.recipe.glass_type}</span>
                    )}
                    {item.recipe.difficulty && (
                      <span>🌟 {item.recipe.difficulty}</span>
                    )}
                  </div>
                  
                  {item.recipe.garnish && (
                    <div className="mt-2 text-xs text-gray-700">
                      <span className="font-semibold">Garnitur:</span> {item.recipe.garnish}
                    </div>
                  )}
                </div>
              )}
              
              {/* Allergene */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="ml-4 mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                  <span className="font-semibold text-yellow-900">⚠️ Allergene:</span>
                  <span className="ml-2 text-yellow-800">{item.allergens.join(', ')}</span>
                </div>
              )}
              
              {/* Notizen */}
              {item.notes && (
                <div className="ml-4 mt-2 text-xs text-gray-600 italic">
                  💬 Hinweis: {item.notes}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">Keine Items vorhanden</p>
        )}
      </div>
      
      <div className="border-t-2 border-gray-400"></div>
      
      {/* Summe */}
      {order.metadata?.totalAmount && (
        <div className="p-6 bg-gray-100">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>GESAMT:</span>
            <span>{order.metadata.totalAmount}€</span>
          </div>
        </div>
      )}
      
      {/* Geschätzte Zubereitungszeit */}
      {order.metadata?.items && order.metadata.items.length > 0 && (
        <div className="p-4 bg-blue-50 border-t-2 border-blue-300">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-900">
              Geschätzte Gesamtzeit: {calculateTotalPrepTime(order.metadata.items)} Min.
            </span>
          </div>
          <p className="text-xs text-center text-gray-700">
            Voraussichtliche Zustellung: {calculateDeliveryTime(order.sent_at || order.created_at || new Date().toISOString(), order.metadata.items)}
          </p>
        </div>
      )}
      
      {/* Kontakt */}
      {order.recipient_contact && (
        <div className="p-4 text-xs text-center text-gray-600 border-t border-gray-300">
          <div className="flex items-center justify-center gap-2">
            <Phone className="w-3 h-3" />
            <span>Rückfragen: {order.recipient_contact}</span>
          </div>
        </div>
      )}
    </div>
  );
};
