// Clara Site-Tour: Map jeder öffentlichen Sektion auf interne Route + Anchor.
// Wird sowohl im Frontend (postMessage) als auch im Edge Prompt verwendet.

export const slugifyRoom = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export interface TourSection {
  key: string;
  route: string;
  anchor?: string;
  label: string;
  description: string;
}

export type Bestuhlung = "u-form" | "parlament" | "bankett" | "theater" | "block";

export interface RoomSpec {
  name: string;
  area_m2: number;
  capacity_theater: number;
  capacity_parlament: number;
  capacity_uform: number;
  capacity_block: number;
  capacity_bankett: number;
  daylight: boolean;
  blackout: boolean;
  note: string;
  area: string; // human readable
}

export const ROOMS: RoomSpec[] = [
  { name: "Bonn / Berlin", area_m2: 120, capacity_theater: 120, capacity_parlament: 80, capacity_uform: 50, capacity_block: 60, capacity_bankett: 90, daylight: true,  blackout: true,  note: "kombiniertes Flaggschiff", area: "120 m²" },
  { name: "Frankfurt",     area_m2: 80,  capacity_theater: 70,  capacity_parlament: 45, capacity_uform: 32, capacity_block: 36, capacity_bankett: 56, daylight: true,  blackout: true,  note: "quadratisch, großzügig", area: "80 m²" },
  { name: "Berlin",        area_m2: 70,  capacity_theater: 60,  capacity_parlament: 36, capacity_uform: 28, capacity_block: 30, capacity_bankett: 48, daylight: true,  blackout: true,  note: "Tageslicht-Klassiker", area: "70 m²" },
  { name: "Hamburg",       area_m2: 50,  capacity_theater: 40,  capacity_parlament: 24, capacity_uform: 20, capacity_block: 22, capacity_bankett: 32, daylight: true,  blackout: true,  note: "kompakt, fokussiert", area: "50 m²" },
  { name: "Bonn",          area_m2: 50,  capacity_theater: 40,  capacity_parlament: 24, capacity_uform: 20, capacity_block: 22, capacity_bankett: 32, daylight: true,  blackout: true,  note: "Boutique-Tagung", area: "50 m²" },
  { name: "Feuer",         area_m2: 42,  capacity_theater: 30,  capacity_parlament: 18, capacity_uform: 16, capacity_block: 18, capacity_bankett: 24, daylight: true,  blackout: false, note: "Art-Center, warm", area: "42 m²" },
  { name: "Wasser",        area_m2: 38,  capacity_theater: 28,  capacity_parlament: 16, capacity_uform: 14, capacity_block: 16, capacity_bankett: 22, daylight: true,  blackout: false, note: "Art-Center, klar", area: "38 m²" },
  { name: "Holz",          area_m2: 35,  capacity_theater: 25,  capacity_parlament: 14, capacity_uform: 12, capacity_block: 14, capacity_bankett: 20, daylight: true,  blackout: false, note: "Art-Center, natürlich", area: "35 m²" },
];

const ROOM_SECTIONS: TourSection[] = ROOMS.map((r) => ({
  key: `raum-${slugifyRoom(r.name)}`,
  route: "/tagungsraeume",
  anchor: `#raum-${slugifyRoom(r.name)}`,
  label: `Tagungsraum ${r.name}`,
  description: `${r.area}, bis ${r.capacity_theater} Personen (Theater) — ${r.note}.`,
}));

export const TOUR_SECTIONS: TourSection[] = [
  { key: "start", route: "/", anchor: "#hero", label: "Startseite", description: "Hotel-Übersicht mit Hero, Highlights und CTAs." },
  { key: "tagungsraeume", route: "/tagungsraeume", anchor: "#tagungscenter", label: "Tagungsräume", description: "8 Konferenzräume von 35–120 m², bis 150 Personen, Tageslicht, Hybrid-Technik." },
  { key: "tagungscenter", route: "/tagungsraeume", anchor: "#tagungscenter", label: "Tagungscenter", description: "Hauptbereich mit 5 Räumen Bonn, Berlin, Frankfurt, Hamburg, Bonn/Berlin kombiniert." },
  { key: "art-center", route: "/tagungsraeume", anchor: "#art-center", label: "Art Center", description: "Drei Element-Räume Feuer, Wasser, Holz für intime Workshops." },
  { key: "impressionen", route: "/tagungsraeume", anchor: "#impressionen", label: "Impressionen", description: "Bildergalerie der Salons und des Heidehof-Saals." },
  ...ROOM_SECTIONS,
  { key: "tagungspauschalen", route: "/tagungspauschalen", anchor: "#pauschalen", label: "Tagungspauschalen", description: "Tagespauschalen mit Verpflegung, Technik und Räumen." },
  { key: "ausstattung-technik", route: "/ausstattung-technik", anchor: "#technik", label: "Ausstattung & Technik", description: "Komplette Hybrid-Tagungstechnik, Beamer, Mikrofone, Streaming." },
  { key: "outdoor-aktiv", route: "/outdoor-aktiv", anchor: "#outdoor", label: "Outdoor & Aktiv", description: "Teamevents draußen, Lagerfeuer, Wald-Workshops, Aktivpakete." },
  { key: "menue", route: "/menue-bestellung", anchor: "#tagesmenue", label: "Tagesmenü", description: "Aktuelle Mittag- und Abendkarte für Tagungsgäste." },
  { key: "wellness", route: "/wellness", anchor: "#wellness", label: "Wellness", description: "Pool-Landschaft, finnische Sauna, Salz-Sauna, Aroma-Dampfbad und Ruhebereich." },
  { key: "spa", route: "/spa", anchor: "#spa", label: "Oriental Spa", description: "Massagen, Beauty- und Wellness-Behandlungen, Pediküre, Maniküre, Sunshower." },
  { key: "getraenkekarte", route: "/getraenkekarte", label: "Getränkekarte", description: "Aperitifs, Weine, Biere, Cocktails, Kaffee- und Tee-Spezialitäten." },
  { key: "speisekarte", route: "/speisekarte", label: "Speisekarte", description: "Vorspeisen, Hauptgänge (Fleisch, Fisch, vegetarisch/vegan), Desserts." },
  { key: "veranstaltungen", route: "/veranstaltungen", label: "Veranstaltungen", description: "Öffentliche Events: Galas, Brunch, Live-Musik, Saisonfeste." },
  { key: "anfrage", route: "/tagungsraeume", anchor: "#tagungscenter", label: "Anfrage", description: "Tagungsanfrage über Clara – mit Raumempfehlung, Verpflegung und Technik." },
];

export const TOUR_KEYS = TOUR_SECTIONS.map((s) => s.key);

export function findSection(key?: string): TourSection | undefined {
  if (!key) return undefined;
  const k = key.toLowerCase().trim();
  return TOUR_SECTIONS.find((s) => s.key === k)
    ?? TOUR_SECTIONS.find((s) => s.label.toLowerCase().includes(k));
}

export function findRoom(roomName?: string): TourSection | undefined {
  if (!roomName) return undefined;
  const slug = slugifyRoom(roomName);
  return TOUR_SECTIONS.find((s) => s.key === `raum-${slug}`);
}

/** Empfehlung: liefert kleinsten passenden Raum + bis zu 2 Alternativen. */
export interface RoomRecommendation {
  primary: RoomSpec;
  alternatives: RoomSpec[];
  reason: string;
}

export function recommendRooms(personen: number, bestuhlung: Bestuhlung = "theater"): RoomRecommendation | null {
  if (!personen || personen < 1) return null;
  const capKey: keyof RoomSpec = (
    bestuhlung === "u-form" ? "capacity_uform" :
    bestuhlung === "parlament" ? "capacity_parlament" :
    bestuhlung === "block" ? "capacity_block" :
    bestuhlung === "bankett" ? "capacity_bankett" :
    "capacity_theater"
  ) as keyof RoomSpec;

  const passend = ROOMS
    .filter((r) => (r[capKey] as number) >= personen)
    .sort((a, b) => (a[capKey] as number) - (b[capKey] as number));

  if (passend.length === 0) {
    // nichts passt → größten Raum + Hinweis
    const largest = [...ROOMS].sort((a, b) => (b[capKey] as number) - (a[capKey] as number))[0];
    return {
      primary: largest,
      alternatives: [],
      reason: `Für ${personen} Personen in ${bestuhlung}-Bestuhlung ist kein einzelner Raum groß genug. Ich empfehle den größten Raum (${largest.name}, max. ${largest[capKey]}) und ggf. Kombinationen — hier sollten wir gemeinsam planen.`,
    };
  }

  const primary = passend[0];
  const alternatives = passend.slice(1, 3);
  const reason = `${primary.name} (${primary.area}, max. ${primary[capKey]} in ${bestuhlung}) passt am besten für ${personen} Personen.`;
  return { primary, alternatives, reason };
}

export function tourPromptBlock(): string {
  const lines = TOUR_SECTIONS.map((s) => `- ${s.key} → ${s.label} (${s.route}${s.anchor ?? ""}): ${s.description}`);
  return lines.join("\n");
}

export const TOUR_EMBED_FLAG = "clara-tour";
