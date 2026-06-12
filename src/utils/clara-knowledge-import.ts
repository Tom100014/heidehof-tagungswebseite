// Konvertiert die statische Heidehof-Wissensbasis in clara_knowledge-Einträge
import { heidehofKnowledgeBase, heidehofFaq } from "@/data/heidehof-knowledge-base";

export interface KnowledgeDraft {
  title: string;
  category: string;
  content: string;
  sort_order: number;
  is_active: boolean;
}

const fmt = (obj: unknown): string => {
  if (obj === null || obj === undefined) return "—";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) return obj.map((v) => `- ${fmt(v)}`).join("\n");
  if (typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => {
        const val = fmt(v);
        return val.includes("\n") ? `**${k}:**\n${val}` : `**${k}:** ${val}`;
      })
      .join("\n");
  }
  return String(obj);
};

export const buildKnowledgeDrafts = (startSortOrder = 0): KnowledgeDraft[] => {
  const kb = heidehofKnowledgeBase;
  const drafts: KnowledgeDraft[] = [];
  let order = startSortOrder;

  const sectionMap: Array<{ key: keyof typeof kb; category: string; title: string }> = [
    { key: "general", category: "general", title: "Allgemein – Haus & Adresse" },
    { key: "location", category: "general", title: "Lage & Anreise" },
    { key: "accommodation", category: "general", title: "Zimmer & Übernachtung" },
    { key: "gastronomy", category: "restaurant", title: "Gastronomie & Restaurants" },
    { key: "wellness", category: "spa", title: "Wellness & SPA" },
    { key: "events", category: "raum", title: "Events & Tagungen" },
    { key: "services", category: "general", title: "Services & Annehmlichkeiten" },
    { key: "sustainability", category: "general", title: "Nachhaltigkeit" },
    { key: "surroundings", category: "outdoor", title: "Umgebung & Ausflüge" },
    { key: "emergency", category: "kontakt", title: "Notfall & wichtige Kontakte" },
  ];

  for (const { key, category, title } of sectionMap) {
    const data = kb[key];
    if (!data) continue;
    drafts.push({
      title,
      category,
      content: fmt(data),
      sort_order: order++,
      is_active: true,
    });
  }

  if (heidehofFaq?.length) {
    drafts.push({
      title: "FAQ – häufige Gästefragen",
      category: "general",
      content: heidehofFaq
        .map((f: { question: string; answer: string }) => `**F:** ${f.question}\n**A:** ${f.answer}`)
        .join("\n\n"),
      sort_order: order++,
      is_active: true,
    });
  }

  return drafts;
};
