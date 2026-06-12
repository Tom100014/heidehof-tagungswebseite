// EU-Pflichtangaben: 14 Allergene + gängige Zusatzstoffe (DE)
export interface AllergenItem {
  code: string;
  label: string;
}

export const ALLERGENS: AllergenItem[] = [
  { code: "A", label: "Glutenhaltiges Getreide" },
  { code: "B", label: "Krebstiere" },
  { code: "C", label: "Eier" },
  { code: "D", label: "Fisch" },
  { code: "E", label: "Erdnüsse" },
  { code: "F", label: "Soja" },
  { code: "G", label: "Milch / Laktose" },
  { code: "H", label: "Schalenfrüchte (Nüsse)" },
  { code: "I", label: "Sellerie" },
  { code: "J", label: "Senf" },
  { code: "K", label: "Sesam" },
  { code: "L", label: "Schwefeldioxid / Sulfite" },
  { code: "M", label: "Lupinen" },
  { code: "N", label: "Weichtiere" },
];

export const ADDITIVES: AllergenItem[] = [
  { code: "1", label: "Farbstoff" },
  { code: "2", label: "Konservierungsstoff" },
  { code: "3", label: "Antioxidationsmittel" },
  { code: "4", label: "Geschmacksverstärker" },
  { code: "5", label: "Geschwefelt" },
  { code: "6", label: "Geschwärzt" },
  { code: "7", label: "Gewachst" },
  { code: "8", label: "Phosphat" },
  { code: "9", label: "Süßungsmittel" },
  { code: "10", label: "Phenylalaninquelle" },
  { code: "11", label: "Koffein" },
  { code: "12", label: "Chinin" },
  { code: "13", label: "Nitritpökelsalz" },
];

export type AllergenMap = Record<string, string[]>;

export const formatAllergens = (codes: string[] | undefined): string => {
  if (!codes || codes.length === 0) return "";
  return codes.join(", ");
};
