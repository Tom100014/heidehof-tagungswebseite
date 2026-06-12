
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UnifiedFormField } from './UnifiedFormField';
import { ValidationRules, validateFormData } from '@/utils/form-validation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Send, ShoppingBag } from 'lucide-react';
import { PremiumFormCard } from './PremiumFormCard';
import { cn } from '@/lib/utils';

// Einheitliches Schema für alle Bestellformulare
const unifiedOrderSchema = z.object({
  firstName: ValidationRules.name,
  lastName: ValidationRules.name,
  roomNumber: ValidationRules.roomNumber,
  phone: ValidationRules.phone,
  email: ValidationRules.email.optional(),
  notes: z.string().max(500, "Notizen dürfen maximal 500 Zeichen haben").optional()
});

export type UnifiedOrderFormData = z.infer<typeof unifiedOrderSchema>;

interface UnifiedOrderFormProps {
  title: string;
  description?: string;
  onSubmit: (data: UnifiedOrderFormData) => Promise<void>;
  isSubmitting?: boolean;
  showEmail?: boolean;
  children?: React.ReactNode; // Für zusätzliche Felder (z.B. Artikel-Auswahl)
  submitButtonText?: string;
  className?: string;
}

export const UnifiedOrderForm: React.FC<UnifiedOrderFormProps> = ({
  title,
  description,
  onSubmit,
  isSubmitting = false,
  showEmail = false,
  children,
  submitButtonText = "Bestellung aufgeben",
  className = ""
}) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const form = useForm<UnifiedOrderFormData>({
    resolver: zodResolver(unifiedOrderSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      roomNumber: "",
      phone: "",
      email: "",
      notes: ""
    },
    mode: "onChange"
  });
  
  const handleSubmit = async (data: UnifiedOrderFormData) => {
    // Plausibilitätsprüfung
    const validation = validateFormData(data);
    setWarnings(validation.warnings);
    
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Formular-Fehler:', error);
    }
  };
  
  const isFormValid = form.formState.isValid && !form.formState.isSubmitting;
  
  return (
    <PremiumFormCard
      title={title}
      description={description}
      icon={<ShoppingBag className="h-6 w-6 text-gold" />}
      className={cn("max-w-2xl", className)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Kundendaten Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                Ihre Daten
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UnifiedFormField
                  form={form}
                  name="firstName"
                  label="Vorname"
                  type="name"
                  placeholder="Ihr Vorname"
                  required
                />
                
                <UnifiedFormField
                  form={form}
                  name="lastName"
                  label="Nachname"
                  type="name"
                  placeholder="Ihr Nachname"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UnifiedFormField
                  form={form}
                  name="roomNumber"
                  label="Zimmernummer"
                  type="room"
                  placeholder="z.B. 204"
                  description="Ihre Hotelzimmernummer"
                  required
                />
                
                <UnifiedFormField
                  form={form}
                  name="phone"
                  label="Telefonnummer"
                  type="phone"
                  placeholder="+49 123 456789"
                  description="Für Rückfragen"
                  required
                />
              </div>
              
              {showEmail && (
                <UnifiedFormField
                  form={form}
                  name="email"
                  label="E-Mail"
                  type="email"
                  placeholder="ihre@email.com"
                  description="Optional für Bestätigung"
                />
              )}
            </div>
            
            {/* Zusätzliche Inhalte (Artikel-Auswahl etc.) */}
            {children}
            
            {/* Notizen Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                Anmerkungen
              </h3>
              
              <UnifiedFormField
                form={form}
                name="notes"
                label="Besondere Wünsche"
                type="text"
                placeholder="Zusätzliche Informationen oder Wünsche..."
                description="Optional - bis zu 500 Zeichen"
              />
            </div>
            
            {/* Warnungen anzeigen */}
            {warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="space-y-1">
                    {warnings.map((warning, index) => (
                      <div key={index}>• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={cn(
                  "w-full h-14",
                  "bg-gold hover:bg-gold-dark text-black",
                  "font-medium text-lg",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-300",
                  "hover:scale-[1.02]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {submitButtonText}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </PremiumFormCard>
    );
  };
