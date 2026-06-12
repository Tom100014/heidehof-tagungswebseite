import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConferenceProgressBar } from "./ConferenceProgressBar";
import { cn } from "@/lib/utils";

interface ConferenceHeroLayoutProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout-Wrapper für alle Conference-Schritte.
 * Visuell konsistent mit der Landing-Page (bg-background, font-serif, apple-Akzente).
 */
export const ConferenceHeroLayout: React.FC<ConferenceHeroLayoutProps> = ({
  eyebrow = "Tagungs-Service",
  title,
  subtitle,
  showBack = true,
  children,
  className,
}) => {
  const navigate = useNavigate();

  // Splittet den Titel: letztes Wort wird im Gold-Italic-Akzent dargestellt (Landing-Stil)
  const words = title.trim().split(" ");
  const accent = words.length > 1 ? words.pop() : "";
  const lead = words.join(" ");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ══ HERO-SEKTION (Landing-Stil) ══ */}
      <section className="relative border-b border-apple/10 bg-card/20 backdrop-blur-sm">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-8 pb-16 md:pt-12 md:pb-24">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-apple mb-8 -ml-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          )}

          <p className="text-apple uppercase tracking-[0.5em] text-xs mb-6">
            {eyebrow}
          </p>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.05]">
            {lead}{" "}
            {accent && <span className="italic text-apple">{accent}</span>}
          </h1>

          {subtitle && (
            <p className="mt-6 text-muted-foreground max-w-2xl md:text-lg leading-relaxed">
              {subtitle}
            </p>
          )}

          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-apple/40 to-transparent" />

          <div className="mt-10">
            <ConferenceProgressBar />
          </div>
        </div>
      </section>

      {/* ══ INHALT ══ */}
      <section className={cn("max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-20", className)}>
        {children}
      </section>
    </div>
  );
};

export default ConferenceHeroLayout;
