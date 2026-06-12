// Mapping vom URL-Pfad zum ElevenLabs-Agent-Context
export type ElevenLabsAgentContext = "homepage" | "tagung" | "wellness" | "zimmer" | "restaurant";

export const ELEVENLABS_CONTEXT_LABELS: Record<ElevenLabsAgentContext, string> = {
  homepage: "Homepage / Allgemein",
  tagung: "Tagung & Events",
  wellness: "Wellness & Spa",
  zimmer: "Zimmer & Reservierung",
  restaurant: "Restaurant & Service",
};

export function contextForPath(pathname: string): ElevenLabsAgentContext {
  const p = pathname.toLowerCase();
  if (p.startsWith("/tagung")) return "tagung";
  if (p.startsWith("/spa") || p.startsWith("/wellness")) return "wellness";
  if (p.startsWith("/zimmer") || p.startsWith("/hotel")) return "zimmer";
  if (p.startsWith("/speisekarte") || p.startsWith("/getraenkekarte") || p.startsWith("/restaurant")) return "restaurant";
  return "homepage";
}
