import React from 'react';
import Mustache from 'mustache';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';

interface TemplatePreviewProps {
  content: string;
  formType: string;
  channel: string;
}

const EXAMPLE_DATA: Record<string, Record<string, any>> = {
  conference: {
    fullName: 'Max Mustermann',
    firstName: 'Max',
    lastName: 'Mustermann',
    company: 'Musterfirma GmbH',
    conferenceRoom: 'Konferenzraum Alpha',
    orderDate: '2025-10-28',
    lunchMenu: 'Menü A - Hähnchenbrust',
    dinnerMenu: 'Menü B - Lachsfilet',
    hotelName: 'Hotel Heidehof',
  },
  restaurant: {
    fullName: 'Anna Schmidt',
    roomNumber: 'Suite 204',
    reservationDate: '2025-10-28',
    reservationTime: '19:30',
    personCount: '2',
    specialRequests: 'Vegetarisches Menü',
    formattedDate: 'Samstag, 28. Oktober 2025',
    hotelName: 'Hotel Heidehof',
    restaurantName: 'Restaurant Maxwell',
  },
  beauty: {
    fullName: 'Maria Weber',
    treatmentName: 'Aromatherapie Massage',
    appointmentDate: '2025-10-27',
    appointmentTime: '14:00',
    roomNumber: '305',
    phoneNumber: '+49 841 12345',
    hotelName: 'Hotel Heidehof',
  },
  bar: {
    customerName: 'Thomas Müller',
    roomNumber: '412',
    itemsText: '2x Aperol Spritz, 1x Club Sandwich',
    totalAmount: '28.50',
    deliveryLocation: 'Zimmer',
    desiredTime: 'Sofort',
    hotelName: 'Hotel Heidehof',
  },
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ content, formType, channel }) => {
  const renderPreview = () => {
    try {
      const exampleData = {
        ...EXAMPLE_DATA[formType] || {},
        ...EXAMPLE_DATA.common || {},
        hotelName: 'Hotel Heidehof',
        restaurantName: 'Restaurant Maxwell',
        timestamp: new Date().toLocaleString('de-DE'),
      };

      const rendered = Mustache.render(content, exampleData);
      return rendered;
    } catch (error) {
      return `⚠️ Fehler beim Rendern der Vorschau: ${error}`;
    }
  };

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Live-Vorschau ({channel})</span>
      </div>
      <ScrollArea className="h-[400px] rounded-md border bg-background">
        <div className="p-4 whitespace-pre-wrap text-sm font-mono">
          {renderPreview()}
        </div>
      </ScrollArea>
      <div className="mt-2 text-xs text-muted-foreground">
        💡 Vorschau mit Beispieldaten
      </div>
    </Card>
  );
};

export default TemplatePreview;
