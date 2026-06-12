import { useLocation } from "react-router-dom";
import { useAssistantMode } from "@/hooks/use-assistant-mode";
import { ClaraWebCall } from "./ClaraWebCall";

/**
 * Globaler Floating-Launcher: bietet einen Browser-Voice-Call mit dem
 * Cartesia Agent (kein Telefonnetz, kein Cent Kosten, sofort).
 *
 * Versteckt im Admin-Bereich und im Modus „clara_only".
 */
export const PhoneCallLauncher = () => {
  const { pathname } = useLocation();
  const { mode } = useAssistantMode();

  if (pathname.startsWith("/admin")) return null;
  if (mode === "clara_only") return null;

  return (
    <div className="fixed bottom-4 left-4 z-[80] flex flex-col items-start gap-2 pointer-events-auto">
      <ClaraWebCall variant="pill" label="Mit Clara sprechen" />
    </div>
  );
};

export default PhoneCallLauncher;
