import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon, Clock, User, Check } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAvailability,
  createBooking,
  nextNDays,
  type AvailabilitySlot,
} from "@/lib/beauty/booking-api";
import { supabase } from "@/integrations/supabase/client";
import { UpsellPrompt } from "@/components/upselling/UpsellPrompt";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** treatment slug — wir resolven die UUID intern */
  treatmentSlug?: string;
  treatmentId?: string;
  treatmentTitle: string;
  priceLabel?: string | null;
  durationLabel?: string | null;
}

export function BookingDrawer({
  open, onOpenChange, treatmentSlug, treatmentId, treatmentTitle, priceLabel, durationLabel,
}: Props) {
  const days = nextNDays(14);
  const [date, setDate] = useState<string>(days[0].iso);
  const [resolvedId, setResolvedId] = useState<string | null>(treatmentId ?? null);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [picked, setPicked] = useState<AvailabilitySlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);


  // resolve slug → id wenn nötig
  useEffect(() => {
    if (treatmentId) { setResolvedId(treatmentId); return; }
    if (!treatmentSlug || !open) return;
    void (async () => {
      const { data } = await supabase
        .from("wellness_treatments")
        .select("id")
        .eq("slug", treatmentSlug)
        .maybeSingle();
      if (data?.id) setResolvedId(data.id);
    })();
  }, [treatmentSlug, treatmentId, open]);

  useEffect(() => {
    if (!open || !resolvedId) return;
    setLoading(true); setPicked(null); setReason(null);
    fetchAvailability(resolvedId, date)
      .then((r) => { setSlots(r.slots ?? []); setReason(r.reason ?? null); })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [open, resolvedId, date]);

  const submit = async () => {
    if (!resolvedId || !picked || !name.trim()) {
      toast.error("Bitte Name und Slot wählen.");
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        treatment_id: resolvedId,
        date,
        time: picked.time,
        staff_id: picked.staff_id,
        guest_name: name.trim(),
        guest_email: email.trim() || undefined,
        guest_phone: phone.trim() || undefined,
        guest_room: room.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setDone(true);
      toast.success("Termin bestätigt — wir sehen uns!");

    } catch (e: any) {
      const msg = e?.message ?? "Buchung fehlgeschlagen";
      if (msg === "slot_taken" || msg === "slot_unavailable") {
        toast.error("Slot wurde gerade vergeben — bitte anderen Zeitpunkt wählen.");
        // refresh
        if (resolvedId) {
          const r = await fetchAvailability(resolvedId, date);
          setSlots(r.slots ?? []);
          setPicked(null);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false); setPicked(null); setName(""); setEmail(""); setPhone(""); setRoom(""); setNotes("");
  };


  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">{treatmentTitle}</SheetTitle>
          <SheetDescription className="text-foreground/60">
            {[durationLabel, priceLabel].filter(Boolean).join(" · ")}
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-gold/15 text-gold grid place-items-center">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl">Termin bestätigt</h3>
            <p className="text-sm text-foreground/70">
              {new Date(date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} um {picked?.time} Uhr<br/>
              bei {picked?.staff_name}
            </p>
            <div className="text-left pt-4">
              <p className="text-xs uppercase tracking-wider text-foreground/60 mb-2">Vielleicht auch interessant</p>
              <UpsellPrompt suggestions={[
                { id: "champ", title: "Champagner aufs Zimmer?", description: "Perfekt zur Entspannung nach der Behandlung.", cta: "Bestellen", category: "drink", href: "/getraenkekarte" },
                { id: "dinner", title: "Tisch im Restaurant?", description: "Reservieren Sie passend zu Ihrem Spa-Termin.", cta: "Reservieren", category: "food", href: "/restaurant" },
              ]} />
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-4">Schließen</Button>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* Datum */}
            <div>
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground/60 mb-3">
                <CalendarIcon className="h-3.5 w-3.5" /> Datum
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex-shrink-0 px-3 py-2 rounded-md border text-center min-w-[64px] transition ${
                      date === d.iso
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-foreground/70 hover:border-gold/40"
                    }`}
                  >
                    <div className="text-[10px] uppercase">{d.weekday}</div>
                    <div className="text-sm font-medium">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Slots */}
            <div>
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground/60 mb-3">
                <Clock className="h-3.5 w-3.5" /> Freie Termine
              </Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-foreground/60"><Loader2 className="h-4 w-4 animate-spin"/> Lade …</div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  {reason === "no_qualified_staff"
                    ? "An diesem Tag ist niemand mit der passenden Qualifikation im Dienst. Bitte anderes Datum wählen."
                    : "Keine freien Termine an diesem Tag."}
                </p>
              ) : (
                (() => {
                  const groups: Record<"Vormittag" | "Mittag" | "Nachmittag" | "Abend", AvailabilitySlot[]> = {
                    Vormittag: [], Mittag: [], Nachmittag: [], Abend: [],
                  };
                  slots.forEach((s) => {
                    const h = parseInt(s.time.slice(0, 2), 10);
                    if (h < 12) groups.Vormittag.push(s);
                    else if (h < 14) groups.Mittag.push(s);
                    else if (h < 17) groups.Nachmittag.push(s);
                    else groups.Abend.push(s);
                  });
                  return (
                    <div className="space-y-4">
                      {Object.entries(groups).map(([label, list]) =>
                        list.length === 0 ? null : (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45 mb-2">{label}</p>
                            <div className="grid grid-cols-4 gap-2">
                              {list.map((s) => (
                                <button
                                  key={`${s.time}-${s.staff_id}`}
                                  onClick={() => setPicked(s)}
                                  className={`px-2 py-2 rounded-md border text-sm transition ${
                                    picked?.time === s.time && picked?.staff_id === s.staff_id
                                      ? "border-gold bg-gold/10 text-gold"
                                      : "border-border text-foreground/80 hover:border-gold/40"
                                  }`}
                                >
                                  {s.time}
                                </button>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  );
                })()
              )}

              {picked && (
                <p className="mt-3 text-xs text-foreground/60 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> {picked.staff_name}
                </p>
              )}
            </div>

            {/* Kontaktdaten */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label htmlFor="b-name">Name *</Label>
                <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ihr Name" />
              </div>
              <div>
                <Label htmlFor="b-email">E-Mail (für Bestätigung)</Label>
                <Input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.de" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="b-room">Zimmer</Label>
                  <Input id="b-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="z.B. 204" />
                </div>
                <div>
                  <Label htmlFor="b-phone">Telefon</Label>
                  <Input id="b-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49…" />
                </div>
              </div>
              <div>
                <Label htmlFor="b-notes">Notiz (optional)</Label>
                <Textarea id="b-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergien, Wünsche …" />
              </div>
            </div>


            <Button
              className="w-full bg-gold text-background hover:bg-gold/90"
              disabled={!picked || !name.trim() || submitting}
              onClick={submit}
            >
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Buche …</> : "Termin verbindlich buchen"}
            </Button>
            <p className="text-[11px] text-foreground/50 text-center">
              Ihre Daten werden ausschließlich zur Terminabwicklung verwendet.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
