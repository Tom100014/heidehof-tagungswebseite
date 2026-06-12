import React, { useState } from 'react';
import { FormStepSelector, UnifiedFormLayout, FormContentCard, FormSection } from './UnifiedFormLayout';
import { UnifiedFormField } from './UnifiedFormField';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Utensils, MapPin, Users, Clock, MessageCircle, Phone } from 'lucide-react';

// Contextual flow types
type OrderContext = 'food' | 'drinks' | 'service';
type DeliveryLocation = 'room' | 'restaurant' | 'bar' | 'pool' | 'spa';
type OrderItem = {
  id: string;
  name: string;
  category: string;
  price?: string;
};

interface ContextualOrderStep {
  id: string;
  title: string;
  description?: string;
  required: boolean;
}

// Schema for contextual order form
const contextualOrderSchema = z.object({
  orderContext: z.enum(['food', 'drinks', 'service']),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().min(1)
  })).min(1, "Bitte wählen Sie mindestens ein Item aus"),
  deliveryLocation: z.enum(['room', 'restaurant', 'bar', 'pool', 'spa']),
  tableNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  bedNumber: z.string().optional(),
  guestType: z.enum(['hotel_guest', 'day_guest', 'external']),
  name: z.string().min(2, "Name ist erforderlich"),
  contactMethod: z.enum(['whatsapp', 'sms', 'phone']),
  contactValue: z.string().min(5, "Kontaktdaten sind erforderlich"),
  specialRequests: z.string().optional(),
  timePreference: z.enum(['now', 'specific']),
  specificTime: z.string().optional(),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "Datenschutzerklärung muss akzeptiert werden"
  })
});

type ContextualOrderValues = z.infer<typeof contextualOrderSchema>;

interface ContextualOrderFlowProps {
  initialContext?: OrderContext;
  availableItems?: OrderItem[];
  onSubmit: (data: ContextualOrderValues, method: 'whatsapp' | 'sms') => Promise<void>;
  onCancel: () => void;
}

const ContextualOrderFlow: React.FC<ContextualOrderFlowProps> = ({
  initialContext,
  availableItems = [],
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<string>('context');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContextualOrderValues>({
    resolver: zodResolver(contextualOrderSchema),
    defaultValues: {
      orderContext: initialContext || 'food',
      items: [],
      deliveryLocation: 'room',
      guestType: 'hotel_guest',
      name: '',
      contactMethod: 'whatsapp',
      contactValue: '',
      timePreference: 'now',
      privacyAccepted: false
    }
  });

  const contextOptions = [
    {
      id: 'food',
      title: 'Essen bestellen',
      description: 'Hauptgerichte, Snacks, Desserts',
      icon: <Utensils className="h-6 w-6 text-gold" />
    },
    {
      id: 'drinks',
      title: 'Getränke bestellen',
      description: 'Alkoholische und alkoholfreie Getränke',
      icon: <div className="h-6 w-6 text-gold">🍹</div>
    },
    {
      id: 'service',
      title: 'Service anfragen',
      description: 'Zimmerservice, Housekeeping, Service',
      icon: <div className="h-6 w-6 text-gold">🛎️</div>
    }
  ];

  const locationOptions = [
    {
      id: 'room',
      title: 'Zimmer',
      description: 'Lieferung an Ihr Hotelzimmer',
      icon: <div className="h-5 w-5 text-gold">🏨</div>
    },
    {
      id: 'restaurant',
      title: 'Restaurant',
      description: 'Abholung im Restaurant Maxwell',
      icon: <Utensils className="h-5 w-5 text-gold" />
    },
    {
      id: 'bar',
      title: 'Bar Max',
      description: 'Lieferung an die Bar',
      icon: <div className="h-5 w-5 text-gold">🍸</div>
    },
    {
      id: 'pool',
      title: 'Pool-Bereich',
      description: 'Servierung am Pool',
      icon: <div className="h-5 w-5 text-gold">🏊</div>
    },
    {
      id: 'spa',
      title: 'Spa-Bereich',
      description: 'Lieferung an den Wellness-Bereich',
      icon: <div className="h-5 w-5 text-gold">🧘</div>
    }
  ];

  const guestTypeOptions = [
    {
      id: 'hotel_guest',
      title: 'Hotelgast',
      description: 'Ich übernachte im Hotel',
      icon: <div className="h-5 w-5 text-gold">🏨</div>
    },
    {
      id: 'day_guest',
      title: 'Tagesgast',
      description: 'Ich bin nur tagsüber im Hotel',
      icon: <Users className="h-5 w-5 text-gold" />
    },
    {
      id: 'external',
      title: 'Externer Gast',
      description: 'Ich bin von außerhalb',
      icon: <MapPin className="h-5 w-5 text-gold" />
    }
  ];

  const handleStepNavigation = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const handleContextualSubmit = async (method: 'whatsapp' | 'sms') => {
    setIsSubmitting(true);
    try {
      const values = form.getValues();
      await onSubmit(values, method);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const watchedValues = form.watch();

    switch (currentStep) {
      case 'context':
        return (
          <FormStepSelector
            title="Was möchten Sie bestellen?"
            description="Wählen Sie die passende Kategorie"
            options={contextOptions}
            selectedOption={watchedValues.orderContext}
            onSelectOption={(optionId) => {
              form.setValue('orderContext', optionId as OrderContext);
              setTimeout(() => handleStepNavigation('location'), 300);
            }}
            onBack={onCancel}
            showBackButton
          />
        );

      case 'location':
        return (
          <FormStepSelector
            title="Wohin soll geliefert werden?"
            description="Wählen Sie den gewünschten Ort"
            options={locationOptions}
            selectedOption={watchedValues.deliveryLocation}
            onSelectOption={(optionId) => {
              form.setValue('deliveryLocation', optionId as DeliveryLocation);
              setTimeout(() => handleStepNavigation('details'), 300);
            }}
            onBack={() => handleStepNavigation('context')}
            showBackButton
          />
        );

      case 'details':
        return (
          <UnifiedFormLayout
            title="Weitere Details"
            description="Geben Sie zusätzliche Informationen an"
            showBackButton
            onBack={() => handleStepNavigation('location')}
          >
            <FormContentCard>
              <FormSection title="Lieferadresse">
                {watchedValues.deliveryLocation === 'room' && (
                  <UnifiedFormField
                    form={form}
                    name="roomNumber"
                    label="Zimmernummer"
                    type="room"
                    placeholder="z.B. 204"
                    required
                  />
                )}
                {watchedValues.deliveryLocation === 'restaurant' && (
                  <UnifiedFormField
                    form={form}
                    name="tableNumber"
                    label="Tischnummer"
                    type="text"
                    placeholder="z.B. Tisch 12"
                  />
                )}
              </FormSection>

              <FormSection title="Gästetyp">
                <div className="grid grid-cols-1 gap-3">
                  {guestTypeOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        watchedValues.guestType === option.id
                          ? 'border-gold bg-gold/10'
                          : 'border-gold/20 hover:border-gold/40'
                      }`}
                      onClick={() => form.setValue('guestType', option.id as any)}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <div className="font-medium text-white">{option.title}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>

              <Button
                onClick={() => handleStepNavigation('contact')}
                className="w-full bg-gold hover:bg-gold-dark text-black"
              >
                Weiter zu Kontaktdaten
              </Button>
            </FormContentCard>
          </UnifiedFormLayout>
        );

      case 'contact':
        return (
          <UnifiedFormLayout
            title="Kontaktdaten"
            description="Wie können wir Sie erreichen?"
            showBackButton
            onBack={() => handleStepNavigation('details')}
          >
            <FormContentCard>
              <FormSection>
                <UnifiedFormField
                  form={form}
                  name="name"
                  label="Ihr Name"
                  type="name"
                  placeholder="Vor- und Nachname"
                  required
                />

                <UnifiedFormField
                  form={form}
                  name="contactValue"
                  label="Telefonnummer"
                  type="phone"
                  placeholder="+49 123 456789"
                  description="Für WhatsApp oder SMS Bestätigung"
                  required
                />

                <UnifiedFormField
                  form={form}
                  name="specialRequests"
                  label="Besondere Wünsche"
                  type="textarea"
                  placeholder="Allergien, Extrawünsche, Anmerkungen..."
                />
              </FormSection>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleContextualSubmit('whatsapp')}
                  disabled={isSubmitting}
                  className="flex-1 bg-zinc-600 hover:bg-zinc-700"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  onClick={() => handleContextualSubmit('sms')}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  SMS
                </Button>
              </div>
            </FormContentCard>
          </UnifiedFormLayout>
        );

      default:
        return null;
    }
  };

  return <>{renderStepContent()}</>;
};

export default ContextualOrderFlow;