// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Building2, User, Mail } from "lucide-react";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { PremiumFormCard } from "@/components/forms/PremiumFormCard";
import { PremiumFormField } from "@/components/forms/PremiumFormField";
import ConferenceHeroLayout from "@/components/conference/ConferenceHeroLayout";

const formSchema = z.object({
  company: z.string().min(2, "Firma muss mindestens 2 Zeichen haben").max(50, "Firma darf maximal 50 Zeichen haben"),
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen haben").max(30, "Vorname darf maximal 30 Zeichen haben"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen haben").max(30, "Nachname darf maximal 30 Zeichen haben"),
  email: z.string().email("Bitte gültige E-Mail-Adresse eingeben").max(120, "E-Mail zu lang"),
  conferenceRoom: z.string().min(1, "Bitte wählen Sie einen Tagungsraum")
});

const ConferencePersonalInfo = () => {
  const navigate = useNavigate();
  const [guestType, setGuestType] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      firstName: "",
      lastName: "",
      conferenceRoom: "",
      email: ""
    }
  });

  useEffect(() => {
    const storedGuestType = localStorage.getItem('conferenceGuestType');
    if (!storedGuestType) {
      navigate('/conference-guests');
    } else {
      setGuestType(storedGuestType);
    }
  }, [navigate]);

  const handleContinue = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const formData = form.getValues();
      localStorage.setItem('conferencePersonalInfo', JSON.stringify(formData));
      navigate('/conference-guests/menu-selection');
    } else {
      toast.error('Bitte füllen Sie alle Felder korrekt aus');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const conferenceRooms = [
    { id: "berlin", name: "Berlin" },
    { id: "hamburg", name: "Hamburg" },
    { id: "frankfurt", name: "Frankfurt" },
    { id: "bonn", name: "Bonn" }
  ];

  const conferenceRoom = form.watch('conferenceRoom');

  return (
    <ConferenceHeroLayout
      eyebrow="Schritt 2 · Ihre Daten"
      title="Persönliche Angaben"
      subtitle="Damit wir Ihre Menüauswahl korrekt zuordnen und Ihnen die Bestätigung per E-Mail zusenden können."
    >
      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <PremiumFormCard
            title="Persönliche Daten"
            description="Bitte geben Sie Ihre persönlichen Daten ein"
            icon={<User className="h-6 w-6 text-apple" />}
          >
            <div className="space-y-6">
              <PremiumFormField
                form={form}
                name="company"
                label="Firma"
                placeholder="Geben Sie Ihren Firmennamen ein"
                type="text"
                icon={<Building2 className="h-4 w-4" />}
                required
                autoComplete="organization"
                rules={[
                  {
                    test: (value) => value.length >= 2 || value.length === 0,
                    message: "Firma muss mindestens 2 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => value.length <= 50,
                    message: "Firma darf maximal 50 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => !value || /^[a-zA-ZäöüÄÖÜß0-9\s\-\.\&\(\)\/]+$/.test(value),
                    message: "Nur Buchstaben, Zahlen und übliche Zeichen erlaubt",
                    severity: 'error'
                  },
                  {
                    test: (value) => value.length >= 3 || value.length === 0,
                    message: "Für beste Ergebnisse mindestens 3 Zeichen eingeben",
                    severity: 'warning'
                  }
                ]}
              />

              <PremiumFormField
                form={form}
                name="firstName"
                label="Vorname"
                placeholder="Geben Sie Ihren Vornamen ein"
                type="text"
                icon={<User className="h-4 w-4" />}
                required
                autoComplete="given-name"
                rules={[
                  {
                    test: (value) => value.length >= 2 || value.length === 0,
                    message: "Vorname muss mindestens 2 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => value.length <= 30,
                    message: "Vorname darf maximal 30 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => !value || /^[a-zA-ZäöüÄÖÜß\s\-]+$/.test(value),
                    message: "Nur Buchstaben, Umlaute, Leerzeichen und Bindestriche erlaubt",
                    severity: 'error'
                  }
                ]}
              />

              <PremiumFormField
                form={form}
                name="lastName"
                label="Nachname"
                placeholder="Geben Sie Ihren Nachnamen ein"
                type="text"
                icon={<User className="h-4 w-4" />}
                required
                autoComplete="family-name"
                rules={[
                  {
                    test: (value) => value.length >= 2 || value.length === 0,
                    message: "Nachname muss mindestens 2 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => value.length <= 30,
                    message: "Nachname darf maximal 30 Zeichen haben",
                    severity: 'error'
                  },
                  {
                    test: (value) => !value || /^[a-zA-ZäöüÄÖÜß\s\-]+$/.test(value),
                    message: "Nur Buchstaben, Umlaute, Leerzeichen und Bindestriche erlaubt",
                    severity: 'error'
                  }
                ]}
              />

              <PremiumFormField
                form={form}
                name="email"
                label="E-Mail"
                placeholder="ihre.email@firma.de"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
                rules={[
                  {
                    test: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                    message: "Bitte gültige E-Mail-Adresse eingeben",
                    severity: 'error'
                  },
                  {
                    test: (value) => value.length <= 120,
                    message: "E-Mail darf maximal 120 Zeichen haben",
                    severity: 'error'
                  }
                ]}
              />

              {/* Conference Room Selection */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-apple" />
                  <span>Tagungsraum</span>
                  <span className="text-apple">*</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {conferenceRooms.map(room => (
                    <Button
                      key={room.id}
                      type="button"
                      variant={conferenceRoom === room.id ? "default" : "outline"}
                      onClick={() => form.setValue('conferenceRoom', room.id, { shouldValidate: true })}
                      className={`relative h-14 transition-all duration-200 ${
                        conferenceRoom === room.id 
                          ? 'bg-gradient-to-r from-apple to-apple-dark text-background hover:from-apple-dark hover:to-apple shadow-lg' 
                          : 'border-apple/30 hover:border-apple/50 bg-background/50 backdrop-blur-sm'
                      }`}
                    >
                      {conferenceRoom === room.id && (
                        <Check className="absolute top-2 right-2 h-4 w-4 animate-scale-in" />
                      )}
                      <span className="font-medium">{room.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-8 bg-gradient-to-r from-apple to-apple-dark hover:from-apple-dark hover:to-apple text-background font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleContinue}
                disabled={!form.formState.isValid}
              >
                Weiter <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </PremiumFormCard>
        </Form>
      </div>
    </ConferenceHeroLayout>
  );
};

export default ConferencePersonalInfo;
