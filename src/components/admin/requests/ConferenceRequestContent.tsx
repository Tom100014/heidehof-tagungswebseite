
import React from "react";
import { OrderItem } from "@/types/order";
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Utensils, Wine, Scissors, Coffee, Table, Frown, Key, Bed, Building, Calendar, FileText } from "lucide-react";

interface ConferenceRequestContentProps {
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
  appointmentDate?: string;
  contactValue?: string;
  customerName?: string;
  roomNumber?: string | number;
  timestamp?: string;
  conferenceRoom?: string;
  orderDate?: string;
  sendMethod?: string;
  lunchMenu?: any;
  dinnerMenu?: any;
  guestInfo?: any;
  menuSelections?: string[];
  dietaryRestrictions?: string;
  specialRequests?: string;
  mealType?: string;
  conferenceDay?: string;
  groupSize?: number;
  contactMethod?: string;
}

export const ConferenceRequestContent: React.FC<ConferenceRequestContentProps> = ({ 
  items, 
  totalAmount, 
  notes,
  appointmentDate,
  contactValue,
  customerName,
  roomNumber,
  timestamp,
  conferenceRoom,
  orderDate,
  sendMethod,
  lunchMenu,
  dinnerMenu,
  guestInfo,
  menuSelections,
  dietaryRestrictions,
  specialRequests,
  mealType,
  conferenceDay,
  groupSize,
  contactMethod
}) => {
  // FRONTEND-DATEN Extraktion für Konferenz-Gäste
  const getCustomerDisplayName = () => {
    if (customerName && customerName.trim() && 
        customerName !== 'undefined undefined' && 
        customerName !== 'undefined' &&
        !customerName.toLowerCase().includes('demo') &&
        !customerName.toLowerCase().includes('test')) {
      return customerName.trim();
    }
    
    return 'Konferenzgast nicht übertragen';
  };

  // KONFERENZRAUM-REFERENZ korrekt anzeigen
  const getConferenceRoomReference = () => {
    if (conferenceRoom && conferenceRoom !== 'undefined' && conferenceRoom.trim() !== '') {
      return { display: conferenceRoom, type: 'conference_room', icon: <Building className="w-4 h-4 text-blue-600" /> };
    }
    
    if (roomNumber && roomNumber !== 'undefined' && roomNumber.toString().trim() !== '') {
      return { display: `Raum ${roomNumber}`, type: 'room', icon: <Building className="w-4 h-4 text-blue-600" /> };
    }
    
    return { display: 'Konferenzraum nicht angegeben', type: 'missing', icon: <Building className="w-4 h-4 text-red-500" /> };
  };

  // KONFERENZ-DATUM formatieren
  const getFormattedConferenceDate = () => {
    if (conferenceDay && conferenceDay !== 'undefined') {
      return conferenceDay;
    }
    
    if (orderDate && orderDate !== 'undefined') {
      const date = new Date(orderDate);
      return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (appointmentDate && appointmentDate !== 'undefined') {
      return appointmentDate;
    }
    
    return 'Konferenz-Datum nicht angegeben';
  };

  // MAHLZEIT-TYP formatieren
  const getMealTypeDisplay = () => {
    switch (mealType) {
      case 'both': return 'Mittagessen & Abendessen';
      case 'lunch': return 'Nur Mittagessen';
      case 'dinner': return 'Nur Abendessen';
      default: return 'Mahlzeit-Typ nicht angegeben';
    }
  };

  const customerDisplay = getCustomerDisplayName();
  const roomReference = getConferenceRoomReference();
  const conferenceDate = getFormattedConferenceDate();
  const mealTypeDisplay = getMealTypeDisplay();

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      {/* RECEIPT HEADER - Konferenz-Stil */}
      <div className="border-b border-gray-200 bg-blue-50 px-4 py-2">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Konferenz-Menü Bestellung
          </h3>
          <p className="text-xs text-gray-500">{timestamp || 'Unbekannte Zeit'}</p>
          <div className="flex justify-center items-center gap-2 mt-1">
            <Building className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Konferenz & Veranstaltungen</span>
          </div>
        </div>
      </div>

      {/* KUNDENDATEN SEKTION */}
      <div className="border-b border-gray-200 p-6">
        <div className="space-y-4">
          {/* Gast-Name */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Gast:</span>
            <span className={`text-sm font-semibold ${
              customerDisplay === 'Konferenzgast nicht übertragen' 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {customerDisplay}
            </span>
          </div>
          
          {/* Konferenzraum/Raum */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Konferenzraum:</span>
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
          
          {/* Konferenz-Datum */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Konferenz-Datum:</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                {conferenceDate}
              </span>
            </div>
          </div>

          {/* Gruppengröße */}
          {groupSize && groupSize > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Teilnehmer:</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {groupSize} Personen
                </span>
              </div>
            </div>
          )}

          {/* Mahlzeit-Typ */}
          {mealType && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Mahlzeit-Typ:</span>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {mealTypeDisplay}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MENÜ-AUSWAHL DETAILS */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
            Menü-Auswahl
          </h4>
        </div>
        
        {menuSelections && menuSelections.length > 0 ? (
          <div className="space-y-2">
            {menuSelections.map((selection, index) => (
              <div key={index} className="flex justify-between items-start py-1 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selection}
                    </span>
                    <div className="ml-2">
                      {selection.toLowerCase().includes('vorspeise') && <span className="text-xs text-zinc-600">🥗</span>}
                      {selection.toLowerCase().includes('hauptgang') && <span className="text-xs text-red-600">🍽️</span>}
                      {selection.toLowerCase().includes('nachspeise') && <span className="text-xs text-yellow-600">🍰</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-1 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                      {item.quantity || 1}x
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.name || 'Konferenz-Menü'}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-600 ml-8 mt-0.5 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500">
            <FileText className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">Keine Menü-Auswahl gefunden</span>
          </div>
        )}
      </div>

      {/* KONTAKT */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">Kontakt:</span>
          <span className="text-xs text-gray-700">
            {contactValue && contactValue !== 'Keine Kontaktdaten' 
              ? contactValue 
              : 'Über Konferenz-System'}
          </span>
        </div>
      </div>

      {/* BESONDERE WÜNSCHE */}
      {(specialRequests || dietaryRestrictions || notes) && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-3">
            {specialRequests && specialRequests.trim() !== '' && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Besondere Wünsche:</span>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                  {specialRequests}
                </p>
              </div>
            )}
            
            {dietaryRestrictions && dietaryRestrictions.trim() !== '' && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Diät-Einschränkungen:</span>
                <p className="text-sm text-gray-700 leading-relaxed bg-yellow-50 p-2 rounded border-l-2 border-yellow-200">
                  {dietaryRestrictions}
                </p>
              </div>
            )}
            
            {notes && notes.trim() !== '' && (notes !== specialRequests) && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Interne Notizen:</span>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-gray-200">
                  {notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERSAND-METHODE */}
      {sendMethod && (
        <div className="border-t border-gray-100 px-4 py-2 bg-blue-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Versand-Methode:</span>
            <span className="text-xs text-blue-700 font-medium">
              {sendMethod === 'email' ? 'E-Mail' :
               sendMethod === 'print' ? 'Drucken' :
               sendMethod === 'both' ? 'E-Mail & Drucken' : sendMethod}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
