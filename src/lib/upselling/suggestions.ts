/**
 * Upselling-Logik: kontextbasierte Vorschläge an verschiedenen Stellen im Hotel-System.
 */

export interface UpsellSuggestion {
  id: string;
  title: string;
  description: string;
  cta: string;
  /** Optional Deep-Link (z.B. /spa, /getraenkekarte) */
  href?: string;
  category: "drink" | "food" | "beauty" | "stay" | "experience";
}

interface FoodOrderContext {
  hasDrinks: boolean;
  isEvening: boolean;
  itemCount: number;
}

export function foodOrderUpsell(ctx: FoodOrderContext): UpsellSuggestion[] {
  const out: UpsellSuggestion[] = [];
  if (!ctx.hasDrinks) {
    out.push({
      id: "wine-pairing",
      title: "Passender Wein zum Essen?",
      description: "Unser Sommelier empfiehlt einen Riesling aus dem Rheingau für €8,50.",
      cta: "Wein hinzufügen",
      href: "/getraenkekarte",
      category: "drink",
    });
  }
  if (ctx.isEvening) {
    out.push({
      id: "breakfast-tomorrow",
      title: "Frühstück morgen aufs Zimmer?",
      description: "Reservieren Sie schon jetzt Ihre Wunschzeit – ab 7:00 Uhr.",
      cta: "Frühstück planen",
      category: "food",
    });
  }
  return out;
}

interface BeautyContext {
  hasUpcomingTreatment: boolean;
}

export function beautyUpsell(_ctx: BeautyContext): UpsellSuggestion[] {
  return [
    {
      id: "massage-add",
      title: "Heute noch freie Massage-Termine",
      description: "30 Min. Nacken-Schulter-Entspannung – €45, perfekt nach einem langen Tag.",
      cta: "Termin sichern",
      href: "/spa",
      category: "beauty",
    },
  ];
}

interface ConferenceContext {
  hasEveningProgramme: boolean;
}

export function conferenceUpsell(ctx: ConferenceContext): UpsellSuggestion[] {
  const out: UpsellSuggestion[] = [];
  if (!ctx.hasEveningProgramme) {
    out.push({
      id: "evening-dinner",
      title: "Gemeinsames Abendessen im Restaurant",
      description: "3-Gang-Menü in unserer Brasserie – ideal zum Netzwerken.",
      cta: "Abend dazubuchen",
      href: "/restaurant",
      category: "food",
    });
    out.push({
      id: "spa-incentive",
      title: "Spa-Slot als Pausen-Highlight",
      description: "Kurz-Massage für Ihre Gruppe – wir reservieren parallele Termine.",
      cta: "Spa anfragen",
      href: "/spa",
      category: "beauty",
    });
  }
  return out;
}

export function roomServiceUpsell(): UpsellSuggestion[] {
  return [
    {
      id: "champagne-suite",
      title: "Veredeln Sie Ihren Abend",
      description: "Eine Flasche Champagner auf Eis – serviert in 20 Minuten.",
      cta: "Hinzufügen",
      category: "drink",
    },
  ];
}
