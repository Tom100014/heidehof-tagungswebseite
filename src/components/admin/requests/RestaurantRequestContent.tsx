
import React from "react";
import { OrderItem } from "@/types/order";
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Utensils, Table, Key, Bed } from "lucide-react";

interface RestaurantRequestContentProps {
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
  appointmentDate?: string;
  contactValue?: string;
  customerName?: string;
  roomNumber?: string | number;
  timestamp?: string;
  deliveryLocation?: string;
  tableNumber?: string;
  bedNumber?: string;
  tentNumber?: string;
  specificLocation?: string;
}

export const RestaurantRequestContent: React.FC<RestaurantRequestContentProps> = ({ 
  items, 
  totalAmount, 
  notes,
  appointmentDate,
  contactValue,
  customerName,
  roomNumber,
  timestamp,
  deliveryLocation,
  tableNumber,
  bedNumber,
  tentNumber,
  specificLocation
}) => {
  // DEBUG: Konsolen-Ausgabe für Restaurant-Fehlersuche
  console.log('🍽️ RestaurantRequestContent Debug:', {
    customerName,
    roomNumber,
    deliveryLocation,
    tableNumber,
    bedNumber,
    tentNumber,
    specificLocation
  });

  // RESTAURANT-DATEN Extraktion - Vor- und Nachname korrekt anzeigen
  const getCustomerDisplayName = () => {
    if (customerName && customerName.trim() && 
        customerName !== 'undefined undefined' && 
        customerName !== 'undefined' &&
        !customerName.toLowerCase().includes('demo') &&
        !customerName.toLowerCase().includes('test')) {
      return customerName.trim();
    }
    
    return 'Kundenname nicht übertragen';
  };

  // ZIMMER/SCHLÜSSEL-REFERENZ korrekt anzeigen für Restaurant
  const getRoomKeyReference = () => {
    if (!roomNumber || 
        roomNumber === 'undefined' || 
        roomNumber.toString().trim() === '' ||
        roomNumber === '999' ||
        roomNumber === '000') {
      return { display: 'Referenz fehlt', type: 'missing' };
    }
    
    const roomStr = roomNumber.toString().trim();
    
    // Zimmernummer (2-3 Ziffern)
    if (/^\d{2,3}[a-zA-Z]?$/.test(roomStr)) {
      return { display: `Zimmer ${roomStr}`, type: 'room', icon: <MapPin className="w-4 h-4 text-zinc-600" /> };
    }
    
    // Schlüsselnummer (längere/alphanumerische Codes)
    if (/^[a-zA-Z0-9]{3,}$/.test(roomStr)) {
      return { display: `Schlüssel ${roomStr}`, type: 'key', icon: <Key className="w-4 h-4 text-blue-600" /> };
    }
    
    return { display: `Referenz ${roomStr}`, type: 'other', icon: <Key className="w-4 h-4 text-gray-600" /> };
  };

  // ERWEITERTE RESTAURANT-ZUSTELLORT-VERARBEITUNG
  const getDetailedRestaurantLocation = () => {
    console.log('🍽️ Restaurant Delivery Location Debug:', { deliveryLocation, tableNumber, bedNumber, tentNumber, specificLocation });
    
    const locationParts = [];
    
    // Basis-Zustellort
    if (deliveryLocation && deliveryLocation !== 'undefined' && deliveryLocation.trim() !== '') {
      locationParts.push(deliveryLocation.trim());
    }
    
    // Spezifischer Ort
    if (specificLocation && specificLocation !== 'undefined' && specificLocation.trim() !== '') {
      locationParts.push(`Details: ${specificLocation.trim()}`);
    }
    
    // Tischnummer separat hinzufügen
    if (tableNumber && tableNumber !== 'undefined' && tableNumber.trim() !== '') {
      locationParts.push(`Tisch ${tableNumber}`);
    }
    
    // Liegenummer für Wellness-Bereich
    if (bedNumber && bedNumber !== 'undefined' && bedNumber.trim() !== '') {
      locationParts.push(`Liege ${bedNumber}`);
    }
    
    // Zeltnummer für Außenbereich
    if (tentNumber && tentNumber !== 'undefined' && tentNumber.trim() !== '') {
      const tentLabel = tentNumber === 'tent1' ? 'Zelt 1 (Strandseite)' : 'Zelt 2 (Poolseite)';
      locationParts.push(tentLabel);
    }
    
    if (locationParts.length > 0) {
      const fullLocation = locationParts.join(' - ');
      return { 
        display: fullLocation, 
        icon: <Table className="w-4 h-4 text-zinc-600" />,
        type: 'restaurant'
      };
    }
    
    return { 
      display: 'Restaurant Maxwell - Zustellort nicht übertragen', 
      icon: <Utensils className="w-4 h-4 text-orange-600" />,
      type: 'restaurant_default'
    };
  };

  const customerDisplay = getCustomerDisplayName();
  const roomReference = getRoomKeyReference();
  const deliveryDetails = getDetailedRestaurantLocation();

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      {/* RESTAURANT HEADER - Professioneller Restaurant-Stil */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Restaurant Maxwell Bestellung
          </h3>
          <p className="text-xs text-gray-500">{timestamp || 'Unbekannte Zeit'}</p>
          <div className="flex justify-center items-center gap-2 mt-1">
            <Utensils className="w-3 h-3 text-zinc-600" />
            <span className="text-xs text-zinc-600 font-medium">Speisen & Getränke Service</span>
          </div>
        </div>
      </div>

      {/* KUNDENDATEN SEKTION */}
      <div className="border-b border-gray-200 p-6">
        <div className="space-y-4">
          {/* Kundenname */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Gast:</span>
            <span className={`text-sm font-semibold ${
              customerDisplay === 'Kundenname nicht übertragen' 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {customerDisplay}
            </span>
          </div>
          
          {/* Referenz (Zimmer/Schlüssel) */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Zimmer/Schlüssel:</span>
            <div className="flex items-center gap-2">
              {roomReference.icon}
              <span className={`text-sm font-semibold ${
                roomReference.type === 'missing' 
                  ? 'text-red-600' 
                  : 'text-gray-900'
              }`}>
                {roomReference.display}
              </span>
            </div>
          </div>
          
          {/* Detaillierter Restaurant-Zustellort */}
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500 uppercase">Zustellort:</span>
            <div className="flex items-start gap-2 max-w-48 text-right">
              {deliveryDetails.icon}
              <span className={`text-sm font-semibold ${
                deliveryDetails.type === 'restaurant_default'
                  ? 'text-red-600' 
                  : 'text-zinc-700'
              }`}>
                {deliveryDetails.display}
              </span>
            </div>
          </div>

          {/* Wunschzeit für Restaurant */}
          {appointmentDate && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Wunschzeit:</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">{appointmentDate}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BESTELLDETAILS */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
            Bestellte Restaurant-Speisen
          </h4>
        </div>
        
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-1 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                      {item.quantity || 1}x
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.name || 'Unbekannter Artikel'}
                    </span>
                    <div className="ml-2">
                      <span className="text-xs text-zinc-600">🍽️</span>
                    </div>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-600 ml-8 mt-0.5 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                {item.price && (
                  <span className="text-sm font-semibold text-gray-900 ml-2">
                    {typeof item.price === 'number' ? `${item.price.toFixed(2)}€` : `${item.price}€`}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500">
            <MessageSquare className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">Keine Restaurant-Artikel gefunden</span>
          </div>
        )}
      </div>

      {/* GESAMTBETRAG */}
      {totalAmount && totalAmount > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 uppercase">Gesamtbetrag:</span>
            <span className="text-lg font-bold text-gray-900">{totalAmount.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* KONTAKT */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">Kontakt:</span>
          <span className="text-xs text-gray-700">
            {contactValue && contactValue !== 'Keine Kontaktdaten' 
              ? contactValue 
              : 'Keine Kontaktaufnahme'}
          </span>
        </div>
      </div>

      {/* ALLERGIEN/SONDERWÜNSCHE */}
      {notes && notes.trim() !== '' && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase">Allergien/Sonderwünsche:</span>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-zinc-200">
              {notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
