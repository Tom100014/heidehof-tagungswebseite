
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UniversalAppointmentForm, { UniversalAppointmentFormValues } from './UniversalAppointmentForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { logAdminMessage } from '@/utils/admin-message-logging';

interface UniversalAppointmentFormWrapperProps {
  title?: string;
  description?: string;
  serviceItem?: {
    name: string;
    price?: string;
    time?: string;
  };
  onSubmit?: (values: UniversalAppointmentFormValues) => void;
  className?: string;
}

const UniversalAppointmentFormWrapper: React.FC<UniversalAppointmentFormWrapperProps> = ({
  title = "Termin vereinbaren",
  description = "Füllen Sie das Formular aus, um einen Termin zu vereinbaren.",
  serviceItem,
  onSubmit,
  className
}) => {
  const handleSubmit = async (values: UniversalAppointmentFormValues) => {
    console.log('Formulardaten:', values);
    
    const timeLabels = {
      morning: 'Vormittag (8:00 - 12:00)',
      afternoon: 'Nachmittag (12:00 - 17:00)',
      evening: 'Abend (17:00 - 20:00)'
    };
    
    // Erstelle formatierte Nachricht (OHNE Footer - nur Gast → Hotel)
    const message = `
╔═══════════════════════════════════════════╗
║    📅  TERMINANFRAGE - ${serviceItem?.name || 'Allgemein'}    ║
╚═══════════════════════════════════════════╝

👤 Gast: ${values.name}
🏠 Zimmer: ${values.roomNumber}

📅 Datum: ${format(values.date, 'EEEE, dd. MMMM yyyy', { locale: de })}
⏰ Zeit: ${timeLabels[values.timePreference]}

${serviceItem ? `
🎯 Service: ${serviceItem.name}
${serviceItem.price ? `💰 Preis: ${serviceItem.price}` : ''}
${serviceItem.time ? `⏱️ Dauer: ${serviceItem.time}` : ''}
` : ''}

📱 Kontakt: ${values.contactMethod === 'whatsapp' ? 'WhatsApp' : 'E-Mail'}
${values.contactMethod === 'whatsapp' ? '📞' : '📧'} ${values.contactValue}

${values.notes ? `📝 Anmerkungen:\n${values.notes}` : ''}

─────────────────────────────────────────
Gesendet: ${format(new Date(), 'dd.MM.yyyy HH:mm')} Uhr
`.trim();
    
    // Log to admin_messages für Admin-Dashboard Integration
    try {
      await logAdminMessage({
        messageType: 'universal_appointment',
        sourceForm: serviceItem?.name || 'Universal Appointment',
        recipientType: values.contactMethod === 'whatsapp' ? 'whatsapp' : 'email',
        recipientContact: 'hotel@der-heidehof.de',
        messageContent: message,
        customerName: values.name,
        roomNumber: values.roomNumber,
        metadata: {
          service: serviceItem?.name,
          date: format(values.date, 'yyyy-MM-dd'),
          time_preference: values.timePreference,
          contact_method: values.contactMethod,
          contact_value: values.contactValue,
          customerPhoneNumber: values.contactMethod === 'whatsapp' ? values.contactValue : undefined,
          notes: values.notes,
          service_price: serviceItem?.price,
          service_duration: serviceItem?.time
        }
      });
    } catch (error) {
      console.error('Failed to log admin message:', error);
    }
    
    if (onSubmit) {
      onSubmit({ ...values, message } as any);
    } else {
      // Standard-Verhalten: Erfolgreiche Übermittlung anzeigen
      toast.success('✅ Termin erfolgreich angefragt!', {
        description: `Wir werden uns über ${values.contactMethod === 'email' ? 'E-Mail' : 'WhatsApp'} bei Ihnen melden.`
      });
      
      // Optional: Nachricht in Zwischenablage kopieren
      try {
        await navigator.clipboard.writeText(message);
        toast.info('Nachricht in Zwischenablage kopiert');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <div className={`w-full max-w-lg mx-auto p-4 ${className || ''}`}>
      <Card className="bg-card/90 border border-gold/20 rounded-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gold text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UniversalAppointmentForm
            serviceItem={serviceItem}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversalAppointmentFormWrapper;
