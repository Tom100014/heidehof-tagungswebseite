// EU-14 Allergen-Auto-Detektion aus Titel & Beschreibung.
// Liefert Codes (a–n nach LMIV) — nicht perfekt, aber als Vorbelegung sehr nützlich.
// Codes:
// a Gluten · b Krebstiere · c Eier · d Fisch · e Erdnüsse · f Soja
// g Milch · h Schalenfrüchte · i Sellerie · j Senf · k Sesam
// l Sulfite · m Lupinen · n Weichtiere

export type AllergenCode =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n";

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  a: "Gluten", b: "Krebstiere", c: "Eier", d: "Fisch", e: "Erdnüsse",
  f: "Soja", g: "Milch", h: "Schalenfrüchte", i: "Sellerie", j: "Senf",
  k: "Sesam", l: "Sulfite", m: "Lupinen", n: "Weichtiere",
};

const RULES: Array<{ code: AllergenCode; words: RegExp }> = [
  { code: "a", words: /\b(brot|brötchen|baguette|ciabatta|crouton|nudel|pasta|spaghetti|tagliatelle|penne|ravioli|gnocchi|pizza|pfannkuchen|teig|panier|paniert|kuchen|torte|muffin|keks|grieß|bulgur|couscous|seitan|weizen|roggen|gerste|dinkel|hafer)\b/i },
  { code: "b", words: /\b(garnele|garnelen|shrimp|krabbe|krabben|hummer|languste|krebs|scampi)\b/i },
  { code: "c", words: /\b(ei|eier|eigelb|eiweiß|omelett|mayonnaise|aioli|hollandaise|carbonara|meringue|baiser|spätzle)\b/i },
  { code: "d", words: /\b(fisch|lachs|thunfisch|forelle|kabeljau|seebarsch|dorade|hering|sardine|anchovis|sardelle|saibling|zander|wels|aal)\b/i },
  { code: "e", words: /\b(erdnuss|erdnüsse|peanut)\b/i },
  { code: "f", words: /\b(soja|tofu|edamame|miso|teriyaki)\b/i },
  { code: "g", words: /\b(butter|sahne|rahm|milch|käse|parmesan|mozzarella|ricotta|feta|gorgonzola|burrata|joghurt|quark|mascarpone|ghee|buttermilch|crème|creme fraîche|panna)\b/i },
  { code: "h", words: /\b(mandel|haselnuss|walnuss|cashew|pistazi|pekan|paranuss|macadamia|nuss|nüsse|pesto)\b/i },
  { code: "i", words: /\b(sellerie|knollensellerie|staudensellerie)\b/i },
  { code: "j", words: /\b(senf|dijon|mostrich)\b/i },
  { code: "k", words: /\b(sesam|tahin|tahini|gomasio)\b/i },
  { code: "l", words: /\b(wein|prosecco|champagner|sekt|cava|riesling|chardonnay|merlot|pinot|grappa|sherry|portwein|trockenobst|rosinen|aprikose getrocknet)\b/i },
  { code: "m", words: /\b(lupine|lupinen)\b/i },
  { code: "n", words: /\b(muschel|miesmuschel|venusmuschel|austern?|tintenfisch|calamari|oktopus|pulpo|sepia|jakobsmuschel|schnecke)\b/i },
];

export function detectAllergens(...texts: Array<string | null | undefined>): AllergenCode[] {
  const text = texts.filter(Boolean).join(" \n ");
  if (!text.trim()) return [];
  const found = new Set<AllergenCode>();
  for (const rule of RULES) if (rule.words.test(text)) found.add(rule.code);
  return Array.from(found);
}

export function detectDietFlags(...texts: Array<string | null | undefined>): {
  is_vegan: boolean; is_vegetarian: boolean; is_glutenfree: boolean;
} {
  const t = texts.filter(Boolean).join(" \n ").toLowerCase();
  const meatOrFish = /\b(rind|kalb|schwein|lamm|huhn|hähnchen|pute|ente|gans|wild|reh|hirsch|wildschwein|speck|schinken|salami|wurst|bacon|fisch|lachs|thunfisch|forelle|garnele|hummer|krabbe|muschel|tintenfisch|krebs)\b/.test(t);
  const dairyOrEgg = /\b(butter|sahne|milch|käse|parmesan|mozzarella|joghurt|quark|ei|eier|honig)\b/.test(t);
  const gluten = /\b(brot|nudel|pasta|teig|panier|paniert|kuchen|grieß|weizen|roggen|gerste|dinkel|hafer|spätzle|knödel)\b/.test(t);
  return {
    is_vegetarian: !meatOrFish,
    is_vegan: !meatOrFish && !dairyOrEgg,
    is_glutenfree: !gluten,
  };
}
