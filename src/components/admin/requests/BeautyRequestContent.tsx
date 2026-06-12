
import React from "react";
import { OrderItem } from "@/types/order";
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Scissors, User, Calendar, Key, Sparkles } from "lucide-react";

interface BeautyRequestContentProps {
  items: OrderItem[] | string;
  totalAmount?: number;
  notes?: string;
  appointmentDate?: string;
  contactValue?: string;
  customerName?: string;
  roomNumber?: string | number;
  timestamp?: string;
  treatmentName?: string;
  treatmentType?: string;
  durationMinutes?: number;
  preferredStaff?: string;
  exactTime?: string;
  timePreference?: string;
  contactMethod?: string;
}

export const BeautyRequestContent: React.FC<BeautyRequestContentProps> = ({ 
  items, 
  totalAmount, 
  notes,
  appointmentDate,
  contactValue,
  customerName,
  roomNumber,
  timestamp,
  treatmentName,
  treatmentType,
  durationMinutes,
  preferredStaff,
  exactTime,
  timePreference,
  contactMethod
}) => {
  // DEBUG: Konsolen-Ausgabe für Beauty-Fehlersuche
  console.log('💅 BeautyRequestContent Debug:', {
    customerName,
    roomNumber,
    treatmentName,
    treatmentType,
    appointmentDate,
    exactTime,
    timePreference,
    preferredStaff
  });

  // BEAUTY-NAMEN Extraktion
  const getBeautyCustomerName = () => {
    if (customerName && customerName.trim() && 
        customerName !== 'undefined undefined' && 
        customerName !== 'undefined' &&
        !customerName.toLowerCase().includes('demo') &&
        !customerName.toLowerCase().includes('test')) {
      return customerName.trim();
    }
    
    return 'Kundenname nicht übertragen';
  };

  // ZIMMER/SCHLÜSSEL-REFERENZ für Beauty-Termine
  const getBeautyRoomReference = () => {
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

  // BEAUTY-BEHANDLUNGSDETAILS verarbeiten
  const getBeautyTreatmentDetails = () => {
    const details = [];
    
    // Hauptbehandlung
    if (treatmentName && treatmentName !== 'undefined') {
      details.push({
        label: 'Behandlung',
        value: treatmentName,
        icon: <Scissors className="w-4 h-4 text-pink-600" />
      });
    }
    
    // Behandlungsart (falls unterschiedlich)
    if (treatmentType && treatmentType !== treatmentName && treatmentType !== 'undefined') {
      details.push({
        label: 'Art',
        value: treatmentType,
        icon: <Sparkles className="w-4 h-4 text-purple-600" />
      });
    }
    
    // Dauer
    if (durationMinutes && durationMinutes > 0) {
      details.push({
        label: 'Dauer',
        value: `${durationMinutes} Min.`,
        icon: <Clock className="w-4 h-4 text-blue-600" />
      });
    }
    
    // Wunsch-Personal
    if (preferredStaff && preferredStaff !== 'undefined') {
      details.push({
        label: 'Personal-Wunsch',
        value: preferredStaff,
        icon: <User className="w-4 h-4 text-orange-600" />
      });
    }
    
    return details;
  };

  // TERMINZEIT für Beauty detailliert verarbeiten
  const getBeautyAppointmentTime = () => {
    // Exakte Zeit bevorzugt
    if (appointmentDate && exactTime) {
      const date = new Date(appointmentDate).toLocaleDateString('de-DE');
      return {
        display: `${date} um ${exactTime}`,
        type: 'exact',
        icon: <Calendar className="w-4 h-4 text-zinc-600" />
      };
    }
    
    // Datum mit Zeitpräferenz
    if (appointmentDate && timePreference) {
      const date = new Date(appointmentDate).toLocaleDateString('de-DE');
      const timeText = timePreference === 'morning' ? 'Vormittag' :
                      timePreference === 'afternoon' ? 'Nachmittag' :
                      timePreference === 'evening' ? 'Abend' : timePreference;
      return {
        display: `${date} - ${timeText}`,
        type: 'preference',
        icon: <Clock className="w-4 h-4 text-amber-600" />
      };
    }
    
    // Nur Datum
    if (appointmentDate) {
      const date = new Date(appointmentDate).toLocaleDateString('de-DE');
      return {
        display: `${date} (Zeit offen)`,
        type: 'date_only',
        icon: <Calendar className="w-4 h-4 text-gray-600" />
      };
    }
    
    return {
      display: 'Terminzeit nicht übertragen',
      type: 'missing',
      icon: <Clock className="w-4 h-4 text-red-500" />
    };
  };

  const customerDisplay = getBeautyCustomerName();
  const roomReference = getBeautyRoomReference();
  const treatmentDetails = getBeautyTreatmentDetails();
  const appointmentTime = getBeautyAppointmentTime();

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      {/* BEAUTY HEADER - Eleganter Beauty-Stil */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Beauty & Wellness Termin
          </h3>
          <p className="text-xs text-gray-500">{timestamp || 'Unbekannte Zeit'}</p>
          <div className="flex justify-center items-center gap-2 mt-1">
            <Scissors className="w-3 h-3 text-pink-600" />
            <span className="text-xs text-pink-600 font-medium">Schönheit & Entspannung</span>
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
          
          {/* Terminzeit */}
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500 uppercase">Terminzeit:</span>
            <div className="flex items-start gap-2 max-w-48 text-right">
              {appointmentTime.icon}
              <span className={`text-sm font-semibold ${
                appointmentTime.type === 'missing' 
                  ? 'text-red-600' 
                  : appointmentTime.type === 'exact'
                    ? 'text-zinc-700'
                    : 'text-gray-900'
              }`}>
                {appointmentTime.display}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BEHANDLUNGSDETAILS */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
            Beauty-Behandlung Details
          </h4>
        </div>
        
        {treatmentDetails.length > 0 ? (
          <div className="space-y-3">
            {treatmentDetails.map((detail, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-2">
                  {detail.icon}
                  <span className="text-xs font-medium text-gray-500 uppercase">{detail.label}:</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 max-w-48 text-right">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500">
            <MessageSquare className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">Keine Behandlungsdetails gefunden</span>
          </div>
        )}
      </div>

      {/* GESAMTBETRAG */}
      {totalAmount && totalAmount > 0 && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 uppercase">Behandlungskosten:</span>
            <span className="text-lg font-bold text-gray-900">{totalAmount.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* KONTAKT */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Kontakt ({contactMethod || 'Art unbekannt'}):
          </span>
          <span className="text-xs text-gray-700">
            {contactValue && contactValue !== 'Keine Kontaktdaten' 
              ? contactValue 
              : 'Keine Kontaktaufnahme'}
          </span>
        </div>
      </div>

      {/* BESONDERE WÜNSCHE/ANMERKUNGEN */}
      {notes && notes.trim() !== '' && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase">Besondere Wünsche & Anmerkungen:</span>
            <p className="text-sm text-gray-700 leading-relaxed bg-gradient-to-r from-pink-50 to-purple-50 p-2 rounded border-l-2 border-pink-200">
              {notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
