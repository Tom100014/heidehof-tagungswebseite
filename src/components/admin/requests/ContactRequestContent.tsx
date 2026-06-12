
import React from "react";
import { OrderItem } from "@/types/order";
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Utensils, Wine, Scissors, Coffee, Table, Frown, Key, Bed, Building, Calendar, FileText, AlertTriangle, Mail, CheckCircle } from "lucide-react";

interface ContactRequestContentProps {
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
  appointmentDate?: string;
  contactValue?: string;
  customerName?: string;
  roomNumber?: string | number;
  timestamp?: string;
  contactMethod?: string;
  contactType?: string;
  serviceContext?: any;
  allowFutureContact?: boolean;
  complaintMessage?: string;
  complaintCategories?: string[];
  otherComplaint?: string;
  complaintSeverity?: string;
  responseRequired?: boolean;
}

export const ContactRequestContent: React.FC<ContactRequestContentProps> = ({ 
  items, 
  totalAmount, 
  notes,
  appointmentDate,
  contactValue,
  customerName,
  roomNumber,
  timestamp,
  contactMethod,
  contactType,
  serviceContext,
  allowFutureContact,
  complaintMessage,
  complaintCategories,
  otherComplaint,
  complaintSeverity,
  responseRequired
}) => {
  // FRONTEND-DATEN Extraktion für Kontakt-Anfragen
  const getCustomerDisplayName = () => {
    if (customerName && customerName.trim() && 
        customerName !== 'undefined undefined' && 
        customerName !== 'undefined' &&
        !customerName.toLowerCase().includes('demo') &&
        !customerName.toLowerCase().includes('test')) {
      return customerName.trim();
    }
    
    return 'Gast nicht übertragen';
  };

  // ZIMMER/SCHLÜSSEL-REFERENZ korrekt anzeigen
  const getRoomKeyReference = () => {
    if (!roomNumber || 
        roomNumber === 'undefined' || 
        roomNumber.toString().trim() === '' ||
        roomNumber === '999' ||
        roomNumber === '000') {
      return { display: 'Referenz fehlt', type: 'missing', icon: <MapPin className="w-4 h-4 text-red-500" /> };
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

  // KONTAKT-TYP Icon ermitteln
  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-zinc-600" />;
      case 'sms': return <Phone className="w-4 h-4 text-orange-600" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  // SCHWEREGRAD-FARBE ermitteln
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-zinc-600';
      default: return 'text-gray-600';
    }
  };

  const customerDisplay = getCustomerDisplayName();
  const roomReference = getRoomKeyReference();

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      {/* RECEIPT HEADER - Kontakt/Beschwerde-Stil */}
      <div className="border-b border-gray-200 bg-red-50 px-4 py-2">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Kontakt-Anfrage / Beschwerde
          </h3>
          <p className="text-xs text-gray-500">{timestamp || 'Unbekannte Zeit'}</p>
          <div className="flex justify-center items-center gap-2 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-xs text-red-600 font-medium">Gäste-Feedback & Support</span>
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
              customerDisplay === 'Gast nicht übertragen' 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {customerDisplay}
            </span>
          </div>
          
          {/* Referenz (Zimmer/Schlüssel) */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Zimmer/Referenz:</span>
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
          
          {/* Kontakt-Typ */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Kontakt-Art:</span>
            <div className="flex items-center gap-2">
              {getContactTypeIcon(contactType || contactMethod || 'none')}
              <span className="text-sm font-semibold text-gray-900">
                {contactType === 'email' ? 'E-Mail' :
                 contactType === 'whatsapp' ? 'WhatsApp' :
                 contactType === 'sms' ? 'SMS' : 'Unbekannt'}
              </span>
            </div>
          </div>

          {/* Kontakt-Wert */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Kontakt-Daten:</span>
            <span className="text-sm font-semibold text-gray-900">
              {contactValue && contactValue !== 'Keine Kontaktdaten' 
                ? contactValue 
                : 'Nicht verfügbar'}
            </span>
          </div>

          {/* Schweregrad */}
          {complaintSeverity && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Dringlichkeit:</span>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${getSeverityColor(complaintSeverity)}`} />
                <span className={`text-sm font-semibold ${getSeverityColor(complaintSeverity)}`}>
                  {complaintSeverity === 'urgent' ? 'Urgent' :
                   complaintSeverity === 'high' ? 'Hoch' :
                   complaintSeverity === 'medium' ? 'Mittel' :
                   complaintSeverity === 'low' ? 'Niedrig' : 'Normal'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BESCHWERDE-DETAILS */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
            Anliegen & Beschwerden
          </h4>
        </div>
        
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-1 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-mono">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.name || 'Unbekanntes Anliegen'}
                    </span>
                    <div className="ml-2">
                      {item.name?.toLowerCase().includes('beschwerde') && <span className="text-xs text-red-600">⚠️</span>}
                      {item.name?.toLowerCase().includes('lob') && <span className="text-xs text-zinc-600">👍</span>}
                      {item.name?.toLowerCase().includes('frage') && <span className="text-xs text-blue-600">❓</span>}
                    </div>
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
            <MessageSquare className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">Keine Details gefunden</span>
          </div>
        )}
      </div>

      {/* KONTAKT-PRÄFERENZEN */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">Zukünftige Kontaktaufnahme:</span>
          <div className="flex items-center gap-2">
            {allowFutureContact ? (
              <CheckCircle className="w-4 h-4 text-zinc-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-gray-700">
              {allowFutureContact ? 'Erlaubt' : 'Nicht erwünscht'}
            </span>
          </div>
        </div>
      </div>

      {/* HAUPTNACHRICHT */}
      {(complaintMessage || notes) && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase">Nachricht:</span>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-red-200">
              {complaintMessage || notes}
            </p>
          </div>
        </div>
      )}

      {/* KATEGORIEN */}
      {complaintCategories && complaintCategories.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Beschwerde-Kategorien:</span>
            <div className="flex flex-wrap gap-2">
              {complaintCategories.map((category, index) => (
                <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SONSTIGE BESCHWERDEN */}
      {otherComplaint && otherComplaint.trim() !== '' && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase">Sonstige Anmerkungen:</span>
            <p className="text-sm text-gray-700 leading-relaxed bg-yellow-50 p-2 rounded border-l-2 border-yellow-200">
              {otherComplaint}
            </p>
          </div>
        </div>
      )}

      {/* ANTWORT ERFORDERLICH */}
      {responseRequired && (
        <div className="border-t border-gray-100 px-4 py-2 bg-red-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Status:</span>
            <span className="text-xs text-red-700 font-medium">
              ⚠️ Antwort erforderlich
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
