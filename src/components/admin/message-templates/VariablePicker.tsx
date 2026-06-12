import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Code, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface VariablePickerProps {
  formType: string;
  onVariableSelect: (variable: string) => void;
}

const FORM_VARIABLES: Record<string, { name: string; variable: string; description: string }[]> = {
  conference: [
    { name: 'Gast-Name', variable: '{{fullName}}', description: 'Vollständiger Name des Gastes' },
    { name: 'Vorname', variable: '{{firstName}}', description: 'Vorname' },
    { name: 'Nachname', variable: '{{lastName}}', description: 'Nachname' },
    { name: 'Firma', variable: '{{company}}', description: 'Firmenname' },
    { name: 'Konferenzraum', variable: '{{conferenceRoom}}', description: 'Raum-Name' },
    { name: 'Bestelldatum', variable: '{{orderDate}}', description: 'Datum der Bestellung' },
    { name: 'Mittagsmenü', variable: '{{lunchMenu}}', description: 'Gewähltes Mittagsmenü' },
    { name: 'Abendmenü', variable: '{{dinnerMenu}}', description: 'Gewähltes Abendmenü' },
  ],
  restaurant: [
    { name: 'Vollständiger Name', variable: '{{fullName}}', description: 'Name des Gastes' },
    { name: 'Zimmernummer', variable: '{{roomNumber}}', description: 'Zimmer-/Suite-Nummer' },
    { name: 'Reservierungsdatum', variable: '{{reservationDate}}', description: 'Datum (formatiert)' },
    { name: 'Reservierungszeit', variable: '{{reservationTime}}', description: 'Uhrzeit' },
    { name: 'Personenanzahl', variable: '{{personCount}}', description: 'Anzahl Gäste' },
    { name: 'Sonderwünsche', variable: '{{specialRequests}}', description: 'Zusätzliche Wünsche' },
    { name: 'Formatiertes Datum', variable: '{{formattedDate}}', description: 'Langes Datumsformat' },
  ],
  beauty: [
    { name: 'Vollständiger Name', variable: '{{fullName}}', description: 'Name des Gastes' },
    { name: 'Behandlung', variable: '{{treatmentName}}', description: 'Name der Behandlung' },
    { name: 'Termin-Datum', variable: '{{appointmentDate}}', description: 'Datum des Termins' },
    { name: 'Termin-Zeit', variable: '{{appointmentTime}}', description: 'Uhrzeit' },
    { name: 'Zimmernummer', variable: '{{roomNumber}}', description: 'Zimmer-Nummer' },
    { name: 'Telefonnummer', variable: '{{phoneNumber}}', description: 'Kontakt-Nummer' },
  ],
  bar: [
    { name: 'Kundenname', variable: '{{customerName}}', description: 'Name des Kunden' },
    { name: 'Zimmernummer', variable: '{{roomNumber}}', description: 'Zimmer-Nummer' },
    { name: 'Bestellitems', variable: '{{itemsText}}', description: 'Bestellte Artikel' },
    { name: 'Gesamtbetrag', variable: '{{totalAmount}}', description: 'Gesamtsumme' },
    { name: 'Lieferort', variable: '{{deliveryLocation}}', description: 'Lieferadresse' },
    { name: 'Wunschzeit', variable: '{{desiredTime}}', description: 'Gewünschte Lieferzeit' },
  ],
  common: [
    { name: 'Hotel-Name', variable: '{{hotelName}}', description: 'Hotel Heidehof' },
    { name: 'Restaurant-Name', variable: '{{restaurantName}}', description: 'Restaurant Maxwell' },
    { name: 'Telefonnummer', variable: '{{phoneNumber}}', description: 'Kontakt-Telefon' },
    { name: 'Zeitstempel', variable: '{{timestamp}}', description: 'Aktuelles Datum/Zeit' },
  ],
};

const VariablePicker: React.FC<VariablePickerProps> = ({ formType, onVariableSelect }) => {
  const variables = [...(FORM_VARIABLES[formType] || []), ...FORM_VARIABLES.common];

  const handleCopy = (variable: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(variable);
    toast.success('Variable kopiert');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code className="h-4 w-4" />
          Variablen einfügen
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[400px] overflow-y-auto" align="start">
        <div className="space-y-2">
          <div className="font-semibold text-sm mb-3">Verfügbare Variablen</div>
          {variables.map((v) => (
            <div
              key={v.variable}
              className="flex items-start justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onVariableSelect(v.variable)}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{v.name}</div>
                <div className="text-xs text-muted-foreground">{v.description}</div>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                  {v.variable}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-8 w-8 p-0"
                onClick={(e) => handleCopy(v.variable, e)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VariablePicker;
