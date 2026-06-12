import { Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

export interface ContactBandProps {
  /** Topic passed to Clara when the primary CTA opens her. */
  claraTopic?: string;
  claraCategory?:
    | "drink" | "food" | "event" | "tagung" | "room"
    | "wellness" | "package" | "general";
}

/**
 * Single source of truth for contact info on the public site.
 * Replaces the repeated phone/email/Clara cards that exist on every subpage.
 */
export const ContactBand = ({
  claraTopic = "Aufenthalt",
  claraCategory = "general",
}: ContactBandProps) => {
  return (
    <section className="border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid md:grid-cols-12 gap-10 md:gap-12 items-start">
        <div className="md:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">Kontakt</p>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-tight">
            Sprechen Sie <span className="italic text-gold">direkt</span> mit uns.
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
            Werktags binnen eines Tages persönliche Antwort. Clara hilft Ihnen sofort,
            unser Team meldet sich danach.
          </p>
        </div>
        <ul className="md:col-span-7 grid sm:grid-cols-2 gap-4">
          <li>
            <a
              href="tel:+4984586440"
              className="flex items-start gap-4 p-5 rounded-2xl border border-gold/20 hover:border-gold/40 bg-card/30 transition-colors"
            >
              <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                  Reservierung
                </div>
                <div className="font-serif text-lg text-foreground mt-1">
                  +49 8458 64 40
                </div>
              </div>
            </a>
          </li>
          <li>
            <a
              href="mailto:reservierung@hotel-der-heidehof.de"
              className="flex items-start gap-4 p-5 rounded-2xl border border-gold/20 hover:border-gold/40 bg-card/30 transition-colors"
            >
              <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                  E-Mail
                </div>
                <div className="font-serif text-lg text-foreground mt-1 break-all">
                  reservierung@hotel-der-heidehof.de
                </div>
              </div>
            </a>
          </li>
          <li>
            <button
              type="button"
              onClick={() =>
                openClaraBubble({
                  category: claraCategory,
                  topic: claraTopic,
                  trigger: "contact-band",
                  source: typeof window !== "undefined" ? window.location.pathname : undefined,
                })
              }
              className="w-full text-left flex items-start gap-4 p-5 rounded-2xl border border-gold/30 hover:border-gold bg-gold/10 hover:bg-gold/15 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                  Sofort-Antwort
                </div>
                <div className="font-serif text-lg text-foreground mt-1">
                  Mit Clara chatten
                </div>
              </div>
            </button>
          </li>
          <li>
            <div className="flex items-start gap-4 p-5 rounded-2xl border border-gold/15 bg-card/20">
              <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                  Adresse
                </div>
                <div className="font-serif text-lg text-foreground mt-1 leading-snug">
                  Bahnhofstraße 1<br />
                  85092 Kösching · Ingolstadt
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};
