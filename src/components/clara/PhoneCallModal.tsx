/**
 * PhoneCallModal — Globaler Listener für START_PHONE_CALL_EVENT.
 *
 * Öffnet einen Dialog, in dem der Gast seine Telefonnummer einträgt.
 * Clara (Cartesia Voice-Agent) ruft den Gast dann über das Telefonnetz
 * zurück — mit dem aktuellen Seitenkontext bereits gebrieft.
 */
import { useCallback, useEffect, useState } from "react";
import { Phone, PhoneCall, Loader2, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  START_PHONE_CALL_EVENT,
  type PhoneCallStartDetail,
} from "@/hooks/use-assistant-mode";
import { readClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { toast } from "sonner";

type Step = "form" | "calling" | "success" | "error";

const PHONE_REGEX = /^[+0][0-9\s\-/().]{6,24}$/;

export const PhoneCallModal = () => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<PhoneCallStartDetail>).detail ?? {};
      // Kontext sicherstellen (read happens in submit)
      void detail;
      setStep("form");
      setErrorMsg(null);
      setOpen(true);
    };
    window.addEventListener(START_PHONE_CALL_EVENT, onEvent as EventListener);
    return () => window.removeEventListener(START_PHONE_CALL_EVENT, onEvent as EventListener);
  }, []);

  const close = useCallback(() => {
    if (step === "calling") return;
    setOpen(false);
    // Zustand leicht verzögert resetten für Schließanimation
    setTimeout(() => {
      setStep("form");
      setErrorMsg(null);
    }, 200);
  }, [step]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      setErrorMsg("Bitte geben Sie eine gültige Telefonnummer ein (z. B. +49 170 1234567).");
      return;
    }
    if (!consent) {
      setErrorMsg("Bitte bestätigen Sie, dass wir Sie zurückrufen dürfen.");
      return;
    }
    setErrorMsg(null);
    setStep("calling");
    try {
      const clara_context = readClaraInquiryContext() ?? {};
      const { data, error } = await supabase.functions.invoke("cartesia-start-call", {
        body: { phone: trimmed, clara_context },
      });
      if (error || !data?.success) {
        const msg = data?.error ?? error?.message ?? "Anruf konnte nicht gestartet werden.";
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      setStep("success");
      toast.success("Clara ruft Sie gleich an", {
        description: "Sie werden in wenigen Sekunden vom Hotel Der Heidehof angerufen.",
      });
      setTimeout(() => close(), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep("error");
    }
  }, [phone, consent, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-call-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-amber-400/30 bg-gradient-to-br from-neutral-950 to-neutral-900 p-6 shadow-2xl shadow-amber-500/10 animate-in zoom-in-95"
      >
        <button
          type="button"
          onClick={close}
          disabled={step === "calling"}
          aria-label="Schließen"
          className="absolute right-3 top-3 rounded-full p-2 text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
            <PhoneCall className="h-5 w-5" />
          </span>
          <div>
            <h2 id="phone-call-title" className="text-lg font-semibold tracking-tight text-amber-100">
              Clara ruft Sie zurück
            </h2>
            <p className="text-xs text-neutral-400">
              Voice-Concierge des Hotel Der Heidehof
            </p>
          </div>
        </div>

        {step === "form" || step === "error" ? (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm leading-relaxed text-neutral-300">
              Hinterlassen Sie Ihre Telefonnummer — Clara ruft Sie in wenigen
              Sekunden direkt an und kennt bereits den Bereich, den Sie gerade
              ansehen.
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Telefonnummer
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-neutral-500 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                required
              />
            </label>

            <label className="flex items-start gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-amber-500"
              />
              <span>
                Ich bin damit einverstanden, vom Hotel Der Heidehof unter dieser
                Nummer zurückgerufen zu werden.
              </span>
            </label>

            {errorMsg && (
              <p className="rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-300"
            >
              <Phone className="h-4 w-4" />
              Jetzt anrufen lassen
            </button>

            <p className="text-[11px] leading-relaxed text-neutral-500">
              Der Anruf erfolgt durch unseren KI-Sprachassistenten Clara und ist
              für Sie kostenfrei. Es fallen keine Gesprächskosten an.
            </p>
          </form>
        ) : null}

        {step === "calling" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm text-neutral-300">Anruf wird gestartet …</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-base font-medium text-emerald-100">
              Clara ruft Sie jetzt an!
            </p>
            <p className="text-xs text-neutral-400">
              Bitte halten Sie Ihr Telefon bereit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneCallModal;
