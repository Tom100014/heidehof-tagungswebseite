/**
 * ClaraWebCallModal — Globaler Listener für START_WEBCALL_EVENT.
 *
 * Öffnet ein Overlay und startet sofort einen Browser-Voice-Call
 * mit dem Cartesia Agent (ClaraWebCall, autoStart=true).
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  START_WEBCALL_EVENT,
  type PhoneCallStartDetail,
} from "@/hooks/use-assistant-mode";
import { ClaraWebCall } from "./ClaraWebCall";

const slugifyRoom = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const ClaraWebCallModal = () => {
  const [open, setOpen] = useState(false);
  // Force remount of ClaraWebCall on each open so autoStart triggers again.
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    const onEvent = (_e: Event) => {
      setSessionKey((k) => k + 1);
      setOpen(true);
    };
    window.addEventListener(START_WEBCALL_EVENT, onEvent as EventListener);
    return () => window.removeEventListener(START_WEBCALL_EVENT, onEvent as EventListener);
  }, []);

  // Brücke: UI-Tool-Calls vom Cartesia Browser-Agent in App-Navigation/Scroll übersetzen
  useEffect(() => {
    const onWebcallTool = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string; args: Record<string, unknown> }>).detail;
      if (!detail) return;
      const { name, args } = detail;

      const dispatchNav = (d: { route?: string; section?: string; anchor?: string }) =>
        window.dispatchEvent(new CustomEvent("clara:navigate-internal", { detail: d }));

      if (name === "show_heidehof_page" && typeof args.url === "string") {
        window.dispatchEvent(new CustomEvent("clara:open-page", {
          detail: { url: args.url, title: typeof args.titel === "string" ? args.titel : "Heidehof", fullscreen: args.fullscreen === true },
        }));
        return;
      }
      if (name === "navigate_to_section" || name === "show_section" || name === "navigate_to" || name === "open_page") {
        const section = typeof args.section === "string" ? args.section
          : typeof args.page === "string" ? args.page
          : typeof args.target === "string" ? args.target : undefined;
        const route = typeof args.route === "string" ? args.route : undefined;
        const anchor = typeof args.anchor === "string" ? args.anchor : undefined;
        if (section || route || anchor) dispatchNav({ route, section, anchor });
        return;
      }
      if (name === "show_menu") {
        const menuType = String(args.menu_type ?? args.meal ?? args.category ?? "").toLowerCase();
        dispatchNav({ route: /drink|getr|bar|wein|bier|cocktail/.test(menuType) ? "/getraenkekarte" : "/speisekarte" });
        return;
      }
      if (name === "show_room" && typeof args.room_name === "string") {
        dispatchNav({ route: "/tagungsraeume", anchor: `raum-${slugifyRoom(args.room_name)}` });
        return;
      }
      if (name === "scroll_to" && typeof args.anchor === "string") {
        dispatchNav({ anchor: args.anchor });
        return;
      }
      if (name === "focus_form_field") {
        const target = typeof args.target === "string" ? args.target : typeof args.field === "string" ? args.field : undefined;
        const route = typeof args.route === "string" ? args.route : undefined;
        if (target) window.dispatchEvent(new CustomEvent("clara:focus-field", { detail: { target, route } }));
        return;
      }
    };
    window.addEventListener("clara:webcall-tool", onWebcallTool as EventListener);
    return () => window.removeEventListener("clara:webcall-tool", onWebcallTool as EventListener);
  }, []);

  if (!open) return null;

  const close = () => setOpen(false);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gespräch mit Clara"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-amber-400/30 bg-black/90 p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Schließen"
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-amber-300/80">Clara · Voice</div>
          <h2 className="mt-1 text-lg font-medium text-white">Gespräch mit Clara</h2>
          <p className="mt-1 text-sm text-white/60">
            Direkt im Browser, ohne Telefonnetz. Erlauben Sie bitte den Mikrofon-Zugriff.
          </p>
        </div>

        <ClaraWebCall
          key={sessionKey}
          variant="block"
          label="Gespräch starten"
          autoStart
          onEnded={close}
        />
      </div>
    </div>
  );
};

export default ClaraWebCallModal;
