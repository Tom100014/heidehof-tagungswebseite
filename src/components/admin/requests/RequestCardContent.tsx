import React from "react";
import { OrderItem } from "@/types/order";
import { Clock, Users, MapPin, Phone, Euro, MessageSquare, Utensils, Wine, Scissors, Coffee, Table, Frown, Key, Bed, Building, Calendar, FileText, AlertTriangle, Mail, CheckCircle } from "lucide-react";

interface RequestCardContentProps {
  items: OrderItem[];
  totalAmount?: number;
  isNew: boolean;
  notes?: string;
  appointmentDate?: string;
  contactValue?: string;
  department?: string;
  kategorie?: string;
  customerName?: string;
  roomNumber?: string | number;
  timestamp?: string;
  deliveryLocation?: string;
  guestCount?: number;
  orderId?: string;
  orderStatus?: string;
  priority?: boolean;
  tableNumber?: string;
  // Neue Beschwerde-spezifische Props
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

export const RequestCardContent: React.FC<RequestCardContentProps> = ({ 
  items, 
  totalAmount, 
  isNew,
  notes,
  appointmentDate,
  contactValue,
  department,
  kategorie,
  customerName,
  roomNumber,
  timestamp,
  deliveryLocation,
  guestCount,
  orderId,
  orderStatus,
  priority,
  tableNumber,
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
  // Prüfen ob es sich um eine Beschwerde handelt
  const isComplaint = department === 'contact' || kategorie === 'Beschwerde' || serviceContext?.complaints || complaintMessage;
  
  const isBeauty = department === 'beauty' || department === 'beauty_treatment';
  const isReservation = kategorie === 'Tischreservierung';
  const isBarMax = department === 'bar_max' || kategorie === 'Bar Mäx';
  const isRestaurant = department === 'restaurant' || department === 'restaurant_maxwell';
  const isShop = department === 'shop' || kategorie === 'Shop-Bestellung';
  const isConference = department === 'conference' || kategorie === 'Konferenz-Bestellung';

  // DEBUG: Konsolen-Ausgabe für Fehlersuche
  console.log('🔍 RequestCardContent Debug:', {
    customerName,
    roomNumber,
    deliveryLocation,
    tableNumber,
    department,
    kategorie,
    isComplaint,
    serviceContext,
    complaintMessage
  });

  // FRONTEND-DATEN Extraktion - Vor- und Nachname korrekt anzeigen
  const getCustomerDisplayName = () => {
    if (customerName && customerName.trim() && 
        customerName !== 'undefined undefined' && 
        customerName !== 'undefined' &&
        !customerName.toLowerCase().includes('demo') &&
        !customerName.toLowerCase().includes('test')) {
      return customerName.trim();
    }
    
    return isComplaint ? 'Gast nicht übertragen' : 'Kundenname nicht übertragen';
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

  // ERWEITERTE ZUSTELLORT-VERARBEITUNG für Bar Mäx
  const getDetailedDeliveryLocation = () => {
    console.log('🚚 Bar Mäx Delivery Location Debug:', { deliveryLocation, tableNumber, isBarMax });
    
    if (isBarMax) {
      const locationParts = [];
      
      // Basis-Zustellort
      if (deliveryLocation && deliveryLocation !== 'undefined' && deliveryLocation.trim() !== '') {
        locationParts.push(deliveryLocation.trim());
      }
      
      // Tischnummer separat hinzufügen
      if (tableNumber && tableNumber !== 'undefined' && tableNumber.trim() !== '') {
        locationParts.push(`Tisch ${tableNumber}`);
      }
      
      if (locationParts.length > 0) {
        const fullLocation = locationParts.join(' - ');
        return { 
          display: fullLocation, 
          icon: <Table className="w-4 h-4 text-zinc-600" />,
          type: 'bar_max'
        };
      }
      
      return { 
        display: 'Bar Mäx - Tischzuteilung offen', 
        icon: <Wine className="w-4 h-4 text-amber-600" />,
        type: 'bar_max_default'
      };
    }
    
    // Standard-Zustellort-Verarbeitung für andere Departments
    if (!deliveryLocation || 
        deliveryLocation === 'undefined' || 
        deliveryLocation.trim() === '') {
      return { 
        display: 'Zustellort nicht übertragen', 
        icon: <MapPin className="w-4 h-4 text-red-500" />,
        type: 'missing'
      };
    }
    
    const location = deliveryLocation.trim();
    
    // Analysiere alle Frontend-Zustellort-Varianten
    if (location.includes('Zimmerservice') || location.includes('Zimmer')) {
      return { 
        display: location, 
        icon: <Bed className="w-4 h-4 text-blue-600" />,
        type: 'room'
      };
    }
    
    if (location.includes('Tisch') || location.includes('Bar')) {
      return { 
        display: location, 
        icon: <Table className="w-4 h-4 text-zinc-600" />,
        type: 'table'
      };
    }
    
    if (location.includes('Liege') || location.includes('Wellness') || location.includes('Spa')) {
      return { 
        display: location, 
        icon: <Bed className="w-4 h-4 text-purple-600" />,
        type: 'wellness'
      };
    }
    
    if (location.includes('Innenbereich') || location.includes('Außenbereich')) {
      return { 
        display: location, 
        icon: <MapPin className="w-4 h-4 text-orange-600" />,
        type: 'area'
      };
    }
    
    return { 
      display: location, 
      icon: <MapPin className="w-4 h-4 text-gray-600" />,
      type: 'custom'
    };
  };

  // Service Context Details extrahieren - ERWEITERT für komplette Korrespondenz
  const getCompleteCorrespondence = () => {
    if (!serviceContext) return null;
    
    const correspondence = [];
    
    // Hauptnachricht
    if (serviceContext.message) {
      correspondence.push({ 
        type: 'message', 
        label: 'Hauptnachricht', 
        content: serviceContext.message, 
        timestamp: null
      });
    }
    
    // Beschwerde-Kategorien
    if (serviceContext.complaints && Array.isArray(serviceContext.complaints)) {
      correspondence.push({ 
        type: 'categories', 
        label: 'Beschwerde-Kategorien', 
        content: serviceContext.complaints.join(', '), 
        timestamp: null
      });
    }
    
    // Weitere Beschwerden
    if (serviceContext.otherComplaint) {
      correspondence.push({ 
        type: 'other', 
        label: 'Weitere Anmerkungen', 
        content: serviceContext.otherComplaint, 
        timestamp: null
      });
    }
    
    // Service-Details (komplette Korrespondenz)
    if (serviceContext.serviceDetails) {
      correspondence.push({ 
        type: 'details', 
        label: 'Vollständige Service-Details', 
        content: typeof serviceContext.serviceDetails === 'string' 
          ? serviceContext.serviceDetails 
          : JSON.stringify(serviceContext.serviceDetails, null, 2), 
        timestamp: null
      });
    }
    
    // Korrespondenz-Verlauf falls vorhanden
    if (serviceContext.correspondence && Array.isArray(serviceContext.correspondence)) {
      serviceContext.correspondence.forEach((item: any, index: number) => {
        correspondence.push({
          type: 'correspondence',
          label: `Korrespondenz #${index + 1}`,
          content: typeof item === 'string' ? item : JSON.stringify(item, null, 2),
          timestamp: item.timestamp || null
        });
      });
    }
    
    // Zusätzliche Felder durchsuchen
    Object.keys(serviceContext).forEach(key => {
      if (!['message', 'complaints', 'otherComplaint', 'serviceDetails', 'correspondence'].includes(key)) {
        const value = serviceContext[key];
        if (value && (typeof value === 'string' || typeof value === 'object')) {
          correspondence.push({
            type: 'additional',
            label: key.charAt(0).toUpperCase() + key.slice(1),
            content: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
            timestamp: null
          });
        }
      }
    });
    
    return correspondence;
  };

  const customerDisplay = getCustomerDisplayName();
  const roomReference = getRoomKeyReference();
  const deliveryDetails = getDetailedDeliveryLocation();
  const fullCorrespondence = getCompleteCorrespondence();

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm">
      {/* RECEIPT HEADER - Beschwerde-spezifisch */}
      <div className={`border-b border-gray-200 px-4 py-2 ${isComplaint ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            {isComplaint ? 'BESCHWERDE & KONTAKTANFRAGE' :
             isBarMax ? 'Bar Mäx Bestellung' : 
             isShop ? 'Shop Bestellung' : 
             isConference ? 'Konferenz Bestellung' : 'Bestellungsdetails'}
          </h3>
          <p className="text-xs text-gray-500">{timestamp || 'Unbekannte Zeit'}</p>
          {isComplaint && (
            <div className="flex justify-center items-center gap-2 mt-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Gäste-Feedback & Support</span>
            </div>
          )}
          {isBarMax && (
            <div className="flex justify-center items-center gap-2 mt-1">
              <Wine className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-600 font-medium">Bar & Getränke Service</span>
            </div>
          )}
          {isShop && (
            <div className="flex justify-center items-center gap-2 mt-1">
              <Building className="w-3 h-3 text-zinc-600" />
              <span className="text-xs text-zinc-600 font-medium">Shop & Wellness Produkte</span>
            </div>
          )}
          {isConference && (
            <div className="flex justify-center items-center gap-2 mt-1">
              <Building className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Konferenz & Veranstaltungen</span>
            </div>
          )}
        </div>
      </div>

      {/* KUNDENDATEN SEKTION */}
      <div className="border-b border-gray-200 p-6">
        <div className="space-y-4">
          {/* Kundenname */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {isComplaint ? 'Gast:' : isBarMax ? 'Gast:' : isShop ? 'Kunde:' : 'Kunde:'}
            </span>
            <span className={`text-sm font-semibold ${
              customerDisplay === 'Gast nicht übertragen' || customerDisplay === 'Kundenname nicht übertragen'
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {customerDisplay}
            </span>
          </div>
          
          {/* Referenz (Zimmer/Schlüssel) */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {isComplaint ? 'Zimmer/Referenz:' : 
               isBarMax ? 'Zimmer/Schlüssel:' : 
               isShop ? 'Zimmer/Referenz:' : 'Referenz:'}
            </span>
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
          
          {/* Kontakt-Typ für Beschwerden */}
          {isComplaint && (contactType || contactMethod) && (
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
          )}

          {/* Detaillierter Zustellort für Nicht-Beschwerden */}
          {!isComplaint && (
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {isBarMax ? 'Tisch/Bereich:' : 
                 isShop ? 'Abholung:' : 'Zustellort:'}
              </span>
              <div className="flex items-start gap-2 max-w-48 text-right">
                {deliveryDetails.icon}
                <span className={`text-sm font-semibold ${
                  deliveryDetails.type === 'missing' 
                    ? 'text-red-600' 
                    : deliveryDetails.type === 'bar_max' 
                      ? 'text-zinc-700'
                      : isShop
                        ? 'text-zinc-700'
                        : 'text-gray-900'
                }`}>
                  {isShop ? (deliveryDetails.display || 'Rezeption - Abholung') : deliveryDetails.display}
                </span>
              </div>
            </div>
          )}

          {/* Kontakt-Daten */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {isComplaint ? 'Kontakt-Daten:' : 'Kontakt:'}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {contactValue && contactValue !== 'Keine Kontaktdaten' 
                ? contactValue 
                : isComplaint 
                  ? 'Nicht verfügbar'
                  : isShop 
                    ? 'Abholung bereit - SMS/WhatsApp'
                    : 'Keine Kontaktaufnahme'}
            </span>
          </div>

          {/* Schweregrad für Beschwerden */}
          {isComplaint && complaintSeverity && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Dringlichkeit:</span>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${getSeverityColor(complaintSeverity)}`} />
                <span className={`text-sm font-semibold ${getSeverityColor(complaintSeverity)}`}>
                  {complaintSeverity === 'urgent' ? 'Dringend' :
                   complaintSeverity === 'high' ? 'Hoch' :
                   complaintSeverity === 'medium' ? 'Mittel' :
                   complaintSeverity === 'low' ? 'Niedrig' : 'Normal'}
                </span>
              </div>
            </div>
          )}

          {/* Spezielle Bar Mäx/Shop Gästeanzahl für Nicht-Beschwerden */}
          {!isComplaint && (isBarMax || isShop) && guestCount && guestCount > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {isShop ? 'Artikel-Anzahl:' : 'Gäste:'}
              </span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {isShop ? `${guestCount} Artikel` : `${guestCount} Personen`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BESCHWERDE-DETAILS / BESTELLDETAILS */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
            {isComplaint ? 'KOMPLETTE BESCHWERDE-KORRESPONDENZ' : 
             isBarMax ? 'Bestellte Getränke & Snacks' : 
             isShop ? 'Bestellte Shop-Artikel' : 'Bestellte Artikel'}
          </h4>
        </div>
        
        {/* VOLLSTÄNDIGE KORRESPONDENZ für Beschwerden */}
        {isComplaint && fullCorrespondence && fullCorrespondence.length > 0 && (
          <div className="space-y-4 mb-4">
            {fullCorrespondence.map((item, index) => (
              <div key={index} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-300">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-red-800 uppercase">
                    {item.label}
                  </div>
                  {item.timestamp && (
                    <div className="text-xs text-red-600">
                      {new Date(item.timestamp).toLocaleString('de-DE')}
                    </div>
                  )}
                </div>
                <div className="text-sm text-red-900 leading-relaxed">
                  {item.type === 'details' || item.type === 'correspondence' || item.type === 'additional' ? (
                    <pre className="whitespace-pre-wrap text-xs bg-red-100 p-3 rounded border font-mono overflow-x-auto">
                      {item.content}
                    </pre>
                  ) : (
                    <div className="bg-white p-3 rounded border">
                      {item.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Complaint Message */}
        {isComplaint && complaintMessage && (
          <div className="bg-red-50 p-3 rounded border-l-4 border-red-200 mb-4">
            <div className="text-xs font-medium text-red-800 uppercase mb-1">
              Beschwerde-Nachricht:
            </div>
            <div className="text-sm text-red-900 leading-relaxed">
              {complaintMessage}
            </div>
          </div>
        )}

        {/* Complaint Categories */}
        {isComplaint && complaintCategories && complaintCategories.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">
              Beschwerde-Kategorien:
            </div>
            <div className="flex flex-wrap gap-2">
              {complaintCategories.map((category, index) => (
                <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Other Complaint */}
        {isComplaint && otherComplaint && (
          <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-200 mb-4">
            <div className="text-xs font-medium text-yellow-800 uppercase mb-1">
              Weitere Anmerkungen:
            </div>
            <div className="text-sm text-yellow-900 leading-relaxed">
              {otherComplaint}
            </div>
          </div>
        )}
        
        {/* Standard Items für Nicht-Beschwerden */}
        {!isComplaint && items && items.length > 0 ? (
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
                    {isBarMax && (
                      <div className="ml-2">
                        {item.name?.toLowerCase().includes('bier') && <span className="text-xs text-amber-600">🍺</span>}
                        {item.name?.toLowerCase().includes('wein') && <span className="text-xs text-purple-600">🍷</span>}
                        {item.name?.toLowerCase().includes('cocktail') && <span className="text-xs text-pink-600">🍹</span>}
                        {item.name?.toLowerCase().includes('snack') && <span className="text-xs text-orange-600">🥨</span>}
                      </div>
                    )}
                    {isShop && (
                      <div className="ml-2">
                        {item.name?.toLowerCase().includes('öl') && <span className="text-xs text-zinc-600">🫒</span>}
                        {item.name?.toLowerCase().includes('gel') && <span className="text-xs text-blue-600">🧴</span>}
                        {item.name?.toLowerCase().includes('lotion') && <span className="text-xs text-pink-600">🧴</span>}
                        {item.name?.toLowerCase().includes('massage') && <span className="text-xs text-purple-600">💆</span>}
                      </div>
                    )}
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
        ) : !isComplaint && (
          <div className="text-center py-3 text-gray-500">
            <MessageSquare className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs">Keine Artikel gefunden</span>
          </div>
        )}
      </div>

      {/* GESAMTBETRAG nur für Nicht-Beschwerden */}
      {!isComplaint && totalAmount && totalAmount > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 uppercase">Gesamtbetrag:</span>
            <span className="text-lg font-bold text-gray-900">{totalAmount.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* KONTAKT-PRÄFERENZEN für Beschwerden */}
      {isComplaint && allowFutureContact !== undefined && (
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
      )}

      {/* ANTWORT ERFORDERLICH */}
      {isComplaint && responseRequired && (
        <div className="border-t border-gray-100 px-4 py-2 bg-red-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase">Status:</span>
            <span className="text-xs text-red-700 font-medium">
              ⚠️ Antwort erforderlich
            </span>
          </div>
        </div>
      )}

      {/* SONDERWÜNSCHE für Nicht-Beschwerden */}
      {!isComplaint && notes && notes.trim() !== '' && (
        <div className="border-t border-gray-100 p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {isBarMax ? 'Besondere Wünsche:' : 
               isShop ? 'Anmerkungen:' : 'Sonderwünsche:'}
            </span>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-blue-200">
              {notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
