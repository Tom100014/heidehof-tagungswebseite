import type { ImageGenerationStyle } from "./image-style-service";

export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  category: "card-type" | "occasion" | "venue";
  description: string;
  style: Partial<ImageGenerationStyle>;
  layoutHint?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  // ── Karten-Typen ────────────────────────────────────────────
  {
    id: "card-daily-menu",
    label: "Tages-Speisekarte",
    emoji: "🍽️",
    category: "card-type",
    description: "Klassische Tages-Speisekarte für Restaurant",
    layoutHint: "daily-menu",
    style: { quality: "professional", portion_size: "medium", perspective: "angle_45", lighting: "warm",
      extra_instructions: "Eleganter Restaurant-Look, weißes Porzellan, frische Kräuter-Garnitur, hochwertige Anrichtung." },
  },
  {
    id: "card-conference-menu",
    label: "Tagungsmenü",
    emoji: "💼",
    category: "card-type",
    description: "Business-Lunch / Tagung – sauber & repräsentativ",
    layoutHint: "conference-menu",
    style: { quality: "professional", portion_size: "medium", perspective: "angle_45", lighting: "natural",
      extra_instructions: "Business-Catering-Stil, klare Linien, helle Tischwäsche, dezente Garnitur." },
  },
  {
    id: "card-drinks",
    label: "Getränkekarte",
    emoji: "🍷",
    category: "card-type",
    description: "Wein, Bar, Cocktails – stimmungsvoll",
    layoutHint: "drinks-card",
    style: { quality: "editorial", portion_size: "small", perspective: "side", lighting: "dramatic",
      extra_instructions: "Bar-Atmosphäre, Glasreflexionen, dunkler Hintergrund, Cocktail-Fotografie-Stil." },
  },
  {
    id: "card-offer-flyer",
    label: "Angebot / Flyer",
    emoji: "🎟️",
    category: "card-type",
    description: "Marketing-Flyer mit Hero-Aufnahme",
    layoutHint: "offer-flyer",
    style: { quality: "editorial", portion_size: "large", perspective: "angle_45", lighting: "dramatic",
      extra_instructions: "Werbe-Hero-Shot, viel Platz für Text-Overlay oben/unten, knackige Farben." },
  },
  {
    id: "card-wellness",
    label: "Wellness-Menü",
    emoji: "🧘",
    category: "card-type",
    description: "Spa, Detox, leichte Küche",
    layoutHint: "wellness-menu",
    style: { quality: "editorial", portion_size: "small", perspective: "top_down", lighting: "natural",
      extra_instructions: "Helle, ruhige Bildsprache, Stein-/Holzuntergrund, Bambus, frische Kräuter, Gurkenwasser, sehr clean." },
  },
  {
    id: "card-bar",
    label: "Bar-Karte",
    emoji: "🍸",
    category: "card-type",
    description: "Cocktails & Spirituosen",
    layoutHint: "bar-card",
    style: { quality: "editorial", portion_size: "small", perspective: "side", lighting: "dramatic",
      extra_instructions: "Dunkler Bar-Counter, Bokeh-Lichter, Eiswürfel-Detail, Premium-Cocktail-Ästhetik." },
  },
  {
    id: "card-cosmetics",
    label: "Kosmetik-Behandlungen",
    emoji: "💆",
    category: "card-type",
    description: "Spa- & Kosmetik-Treatments",
    layoutHint: "cosmetics-menu",
    style: { quality: "editorial", portion_size: "small", perspective: "top_down", lighting: "natural",
      extra_instructions: "Spa-Ästhetik, weiche Tücher, Natursteine, Blütenblätter, Öle, Pinsel – warmes Naturholz." },
  },

  // ── Anlässe / Saison ────────────────────────────────────────
  {
    id: "occ-mothers-day",
    label: "Muttertag",
    emoji: "🌷",
    category: "occasion",
    description: "Pastellfarben, Blüten, romantisch",
    style: { quality: "editorial", portion_size: "medium", perspective: "angle_45", lighting: "natural",
      extra_instructions: "Pastellfarben, Tulpen / Pfingstrosen, helles Leinen, romantisch-feminin, viel Tageslicht." },
  },
  {
    id: "occ-valentine",
    label: "Valentinstag",
    emoji: "❤️",
    category: "occasion",
    description: "Rot, Kerzenlicht, Romantik",
    style: { quality: "editorial", portion_size: "tasting", perspective: "angle_45", lighting: "warm",
      extra_instructions: "Tiefrote Akzente, Rosenblätter, Kerzenschein, dunkler Hintergrund, intime Stimmung." },
  },
  {
    id: "occ-newyear",
    label: "Silvester",
    emoji: "🥂",
    category: "occasion",
    description: "Gold, Champagner, festlich",
    style: { quality: "editorial", portion_size: "tasting", perspective: "angle_45", lighting: "dramatic",
      extra_instructions: "Gold-Akzente, Champagnerflöten, Bokeh-Lichter, festliche Glamour-Stimmung, schwarz-gold." },
  },
  {
    id: "occ-easter",
    label: "Ostern",
    emoji: "🐣",
    category: "occasion",
    description: "Frühling, Pastell, frisch",
    style: { quality: "professional", portion_size: "medium", perspective: "angle_45", lighting: "natural",
      extra_instructions: "Frühlingsblumen, Pastell-Eier-Deko, Birkenzweige, helle frische Frühlingsstimmung." },
  },
  {
    id: "occ-christmas",
    label: "Weihnachten",
    emoji: "🎄",
    category: "occasion",
    description: "Tannengrün, Gewürze, gemütlich",
    style: { quality: "editorial", portion_size: "large", perspective: "angle_45", lighting: "warm",
      extra_instructions: "Tannenzweige, Zimt, Sternanis, Kerzen, rot-grüne Akzente, gemütliches Winter-Restaurant." },
  },
  {
    id: "occ-summer-terrace",
    label: "Sommer-Terrasse",
    emoji: "☀️",
    category: "occasion",
    description: "Hell, leicht, mediterran",
    style: { quality: "professional", portion_size: "medium", perspective: "angle_45", lighting: "natural",
      extra_instructions: "Sonnige Terrasse, Olivenzweige, Zitronen, helles Leinen, mediterrane Sommerstimmung." },
  },
];
