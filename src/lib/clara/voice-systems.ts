export type ClaraVoiceSystemId = "cartesia_pipeline" | "openai_realtime";

export type ClaraVoiceTool =
  | "Seitenkontext"
  | "Proaktive Hinweise"
  | "Barge-in"
  | "Seitensteuerung"
  | "Bestellungen"
  | "Tagungs-Leads"
  | "Beschwerden"
  | "Admin-Transkript"
  | "Direktes Speech-to-Speech";

export interface ClaraVoiceSystemInfo {
  id: ClaraVoiceSystemId;
  name: string;
  shortName: string;
  badge: string;
  summary: string;
  costModel: string;
  bestFor: string;
  risks: string;
  tools: ClaraVoiceTool[];
}

export const CLARA_VOICE_SYSTEMS: Record<ClaraVoiceSystemId, ClaraVoiceSystemInfo> = {
  cartesia_pipeline: {
    id: "cartesia_pipeline",
    name: "Stabile Hotel-Pipeline",
    shortName: "Cartesia + Clara-Chat",
    badge: "Produktiv",
    summary: "Mikrofonaufnahme, STT, Clara-Chat, Tool-Ausführung und Cartesia-TTS laufen kontrolliert nacheinander.",
    costModel: "Kosten entstehen pro Sprachaufnahme, Chat-Antwort und TTS-Ausgabe. Gut steuerbar, weil Clara erst nach Nutzeraktion startet.",
    bestFor: "Aktueller Live-Betrieb, Admin-Übergabe, Bestellungen, Beschwerden und Tagungsanfragen.",
    risks: "Etwas weniger natürlich als echtes Speech-to-Speech, dafür stabiler und leichter zu debuggen.",
    tools: [
      "Seitenkontext",
      "Proaktive Hinweise",
      "Barge-in",
      "Seitensteuerung",
      "Bestellungen",
      "Tagungs-Leads",
      "Beschwerden",
      "Admin-Transkript",
    ],
  },
  openai_realtime: {
    id: "openai_realtime",
    name: "OpenAI Realtime Voice",
    shortName: "OpenAI Realtime",
    badge: "Premium",
    summary: "Direkte WebRTC-Verbindung mit natürlicher Speech-to-Speech-Konversation und niedriger Latenz.",
    costModel: "Kosten laufen während der aktiven Realtime-Sitzung für Audio-Eingabe, Audio-Ausgabe und Tool-Nutzung. Am besten mit klarer Aktivierung und Timeout.",
    bestFor: "Maximal natürliche Gespräche, schnelle Unterbrechungen, Premium-Demo und Zukunftsstandard für Clara.",
    risks: "Benötigt OPENAI_API_KEY und Realtime-Freigabe. Bei Fehlern fällt Clara automatisch auf die stabile Pipeline zurück.",
    tools: [
      "Seitenkontext",
      "Proaktive Hinweise",
      "Barge-in",
      "Seitensteuerung",
      "Bestellungen",
      "Tagungs-Leads",
      "Beschwerden",
      "Admin-Transkript",
      "Direktes Speech-to-Speech",
    ],
  },
};

export const DEFAULT_CLARA_VOICE_SYSTEM: ClaraVoiceSystemId = "cartesia_pipeline";

export const isClaraVoiceSystemId = (value: unknown): value is ClaraVoiceSystemId =>
  value === "cartesia_pipeline" || value === "openai_realtime";
