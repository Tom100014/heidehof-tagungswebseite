
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactForm } from "./ContactForm";
import { ContactFormValues } from "./ContactFormSchema";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle } from "lucide-react";
import { contactService } from "@/services/contact/contact-service";

interface DataInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ContactFormValues) => Promise<void>;
  title?: string;
  description?: string;
  serviceDetails?: {
    serviceId: string;
    serviceName: string;
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
      price?: string;
    }>;
  };
}

export function DataInputModal({
  open,
  onOpenChange,
  onSubmit,
  title = "Ihre Kontaktdaten",
  description = "Bitte geben Sie Ihre Kontaktdaten ein, damit wir Sie bezüglich Ihrer Anfrage kontaktieren können.",
  serviceDetails
}: DataInputModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Erstelle formatierte Nachricht (OHNE Footer - Gast → Hotel)
      const contactMethodLabel = values.contactMethod === 'email' ? '📧 E-Mail' : '📱 WhatsApp/Telefon';
      const message = `📞 Kontaktanfrage

👤 Name: ${values.name}
${values.roomNumber ? `🏨 Zimmer: ${values.roomNumber}\n` : ''}
${contactMethodLabel}: ${values.contactValue}
${values.allowFutureContact ? '✅ Kontaktaufnahme erlaubt' : ''}

${serviceDetails ? `📋 Service: ${serviceDetails.serviceName}` : ''}`;
      
      if (onSubmit) {
        await onSubmit({ ...values, message } as any);
      } else {
        const result = await contactService.saveContactRequest({
          name: values.name,
          contactMethod: values.contactMethod,
          contactValue: values.contactValue,
          allowFutureContact: values.allowFutureContact,
          privacyAccepted: values.privacyAccepted,
          serviceDetails,
          roomNumber: values.roomNumber,
          message
        } as any);
        
        if (!result.success) {
          throw result.error || new Error("Ein unerwarteter Fehler ist aufgetreten.");
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Fehler beim Übermitteln des Formulars:", error);
      toast({
        title: "Ein Fehler ist aufgetreten",
        description: "Wir konnten Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-modal border-gold/30 bg-background/95 backdrop-blur-sm mb-[5vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-serif text-gold-light">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <ContactForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          serviceDetails={serviceDetails}
        />
      </DialogContent>
    </Dialog>
  );
}

export default DataInputModal;
