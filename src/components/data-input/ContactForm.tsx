import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Loader2, CheckCircle, Heart, Mail, Phone } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { contactFormSchema, ContactFormValues, validateEmail, validatePhone } from "./ContactFormSchema";
import { DialogFooter } from "@/components/ui/dialog";
import { PremiumFormCard } from "@/components/forms/PremiumFormCard";
import { PremiumFormField } from "@/components/forms/PremiumFormField";
import { Checkbox } from "@/components/ui/checkbox";
import { useMobileOptimizations } from "@/hooks/use-mobile-optimizations";

interface ContactFormProps {
  onSubmit: (data: ContactFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
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

export const ContactForm: React.FC<ContactFormProps> = ({ 
  onSubmit, 
  onCancel,
  isSubmitting,
  serviceDetails
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const { isMobile } = useMobileOptimizations();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      contactMethod: "email",
      contactValue: "",
      allowFutureContact: true,
      privacyAccepted: false,
      serviceDetails: serviceDetails || undefined,
      roomNumber: ""
    },
    mode: "onChange" // Aktiviert die Validierung bei Änderungen für besseres Feedback
  });

  const contactMethod = form.watch("contactMethod");
  
  // Verbesserte Fehlerbehandlung mit visueller Feedback-Verbesserung
  useEffect(() => {
    if (submissionAttempted) {
      const subscription = form.watch((value, { name }) => {
        // Validierung einzelner Felder beim Ändern für besseres Nutzerfeedback
        if (name === "contactValue") {
          validateContactValue(value.contactValue || "");
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, submissionAttempted]);
  
  // Validierungsfunktion für Kontaktwerte
  const validateContactValue = (value: string): boolean => {
    if (!value) return false;
    
    if (contactMethod === "email") {
      return validateEmail(value);
    } else if (contactMethod === "whatsapp" || contactMethod === "sms") {
      return validatePhone(value);
    }
    
    return true;
  };

  const handleSubmit = async (values: ContactFormValues) => {
    setSubmissionAttempted(true);
    
    // Zusätzliche Validierung basierend auf der Kontaktmethode
    if (contactMethod !== "none") {
      setIsValidating(true);
      let isValid = true;
      
      if (contactMethod === "email") {
        isValid = validateEmail(values.contactValue);
        if (!isValid) {
          form.setError("contactValue", {
            type: "manual",
            message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
          });
        }
      } else if (contactMethod === "whatsapp" || contactMethod === "sms") {
        isValid = validatePhone(values.contactValue);
        if (!isValid) {
          form.setError("contactValue", {
            type: "manual",
            message: "Bitte geben Sie eine gültige Telefonnummer ein.",
          });
        }
      }
      
      setIsValidating(false);
      if (!isValid) return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Formular konnte nicht übermittelt werden:", error);
      // Fehler werden in der übergeordneten Komponente behandelt
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <PremiumFormCard
          title="Service & Support"
          description="Ihre Kontaktdaten"
          icon={<Heart className="h-6 w-6 text-gold" />}
        >
          <div className="space-y-5">
            <PremiumFormField
              form={form}
              name="name"
              label="Name"
              type="name"
              placeholder="Ihr Name"
              required
              autoValidate
            />
            
            <PremiumFormField
              form={form}
              name="roomNumber"
              label="Zimmernummer"
              type="room"
              placeholder="z.B. 204"
              description="Optional"
            />
            
            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Kontaktmethode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          field.value === 'email'
                            ? 'border-gold bg-gold/10'
                            : 'border-gold/20 hover:border-gold/40'
                        }`}
                        onClick={() => field.onChange('email')}
                      >
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="cursor-pointer flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gold" />
                          E-Mail
                        </Label>
                      </div>
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          field.value === 'whatsapp'
                            ? 'border-gold bg-gold/10'
                            : 'border-gold/20 hover:border-gold/40'
                        }`}
                        onClick={() => field.onChange('whatsapp')}
                      >
                        <RadioGroupItem value="whatsapp" id="whatsapp" />
                        <Label htmlFor="whatsapp" className="cursor-pointer flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gold" />
                          WhatsApp
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <PremiumFormField
              form={form}
              name="contactValue"
              label={contactMethod === 'email' ? 'E-Mail-Adresse' : 'Telefonnummer'}
              type={contactMethod === 'email' ? 'email' : 'phone'}
              placeholder={contactMethod === 'email' ? 'ihre@email.de' : '+49 123 456789'}
              required
              autoValidate
            />
            
            <FormField
              control={form.control}
              name="allowFutureContact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-xl border border-gold/20 bg-background/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Ich möchte über Angebote informiert werden
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="privacyAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-xl border border-gold/20 bg-background/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Ich akzeptiere die Datenschutzerklärung *
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </PremiumFormCard>
        
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isValidating}
            className="w-full md:w-auto border-gold/30 hover:border-gold/50"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black w-full md:w-auto"
            disabled={isSubmitting || isValidating}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Überprüfen...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Senden
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
