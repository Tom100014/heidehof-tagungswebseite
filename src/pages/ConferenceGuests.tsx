// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, UserCheck, Hotel } from "lucide-react";

import { cn } from "@/lib/utils";
import ConferenceHeroLayout from "@/components/conference/ConferenceHeroLayout";

interface GuestTypeOption {
  id: string;
  title: string;
  description: string;
  detail: string;
}

const guestTypes: GuestTypeOption[] = [
  {
    id: "day_guest",
    title: "Tagungsgast",
    description: "Erhält das Mittagsmenü",
    detail: "Für Teilnehmende, die nur tagsüber im Hause sind.",
  },
  {
    id: "overnight_guest",
    title: "Tagungsgast + Übernachtung",
    description: "Erhält Mittag- und Abendmenü",
    detail: "Inklusive Auswahl für das Abend-Dinner.",
  },
];

const ConferenceGuests = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handle = (id: string) => {
    setSelected(id);
    localStorage.setItem("conferenceGuestType", id);
    setTimeout(() => navigate("/conference-guests/personal-info"), 250);
  };

  return (
    <ConferenceHeroLayout
      eyebrow="Schritt 1 · Gästetyp"
      title="Willkommen im Heidehof"
      subtitle="Bitte wählen Sie aus, wie Sie an unserem Tagungstag teilnehmen – damit wir Ihre Menüauswahl korrekt vorbereiten können."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {guestTypes.map((type, index) => {
          const isSelected = selected === type.id;
          const Icon = type.id === "day_guest" ? UserCheck : Hotel;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handle(type.id)}
              style={{ animationDelay: `${index * 80}ms` }}
              className={cn(
                "group relative text-left p-8 bg-card/30 backdrop-blur-sm border transition-all duration-300",
                isSelected
                  ? "border-apple shadow-[0_20px_60px_-20px_hsl(var(--apple)/0.45)]"
                  : "border-apple/20 hover:border-apple/50 hover:-translate-y-1"
              )}
            >
              <div className="flex items-start gap-5">
                <div
                  className={cn(
                    "w-14 h-14 flex items-center justify-center border transition-all",
                    isSelected
                      ? "border-apple bg-apple/10"
                      : "border-apple/30 group-hover:border-apple/60"
                  )}
                >
                  <Icon className="w-6 h-6 text-apple" />
                </div>
                <div className="flex-1">
                  <p className="text-apple uppercase tracking-[0.3em] text-xs mb-3">
                    {type.description}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-foreground leading-tight">
                    {type.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                    {type.detail}
                  </p>
                </div>
                {isSelected && (
                  <div className="bg-apple p-1.5">
                    <Check className="h-4 w-4 text-background" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ConferenceHeroLayout>
  );
};

export default ConferenceGuests;
