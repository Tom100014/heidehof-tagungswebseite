import { useEffect, useMemo, useState } from "react";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, PartyPopper, Tag, Clock, Sparkles, Star, Utensils } from "lucide-react";
import { AskClaraButton } from "@/components/clara/AskClaraButton";

interface Event {
  id: string; slug: string; title: string; subtitle: string | null; description_md: string | null;
  event_type: string; starts_at: string | null; ends_at: string | null;
  location: string | null; price_label: string | null; capacity: number | null;
  hero_image_url: string | null; booking_enabled: boolean; tags: string[] | null;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : null;
const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;
const fmtDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { weekday: "long" }) : null;

const EVENT_TYPE_LABEL: Record<string, string> = {
  hochzeit: "Hochzeit",
  firmenfeier: "Firmenfeier",
  weihnachtsfeier: "Weihnachtsfeier",
  silvester: "Silvester",
  brunch: "Brunch",
  gala: "Gala & Dinner",
  live_music: "Live Musik",
  tagung: "Tagung",
  sonstiges: "Erlebniswelt",
};

const Veranstaltungen = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("events" as never)
        .select("id, slug, title, subtitle, description_md, event_type, starts_at, ends_at, location, price_label, capacity, hero_image_url, booking_enabled, tags")
        .eq("is_active", true)
        .eq("is_published", true)
        .order("starts_at", { ascending: true, nullsFirst: false });
      setEvents((data as unknown as Event[]) ?? []);
    })();
  }, []);

  // Sort chronologically: upcoming first (asc), past at the end
  const sortedEvents = useMemo(() => {
    const now = Date.now();
    const upcoming: Event[] = [];
    const past: Event[] = [];
    const undated: Event[] = [];
    for (const e of events) {
      if (!e.starts_at) { undated.push(e); continue; }
      (new Date(e.starts_at).getTime() >= now ? upcoming : past).push(e);
    }
    upcoming.sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
    past.sort((a, b) => new Date(b.starts_at!).getTime() - new Date(a.starts_at!).getTime());
    return [...upcoming, ...undated, ...past];
  }, [events]);

  return (
    <SubPageLayout
      title="Veranstaltungen Ingolstadt."
      titleAccent="Termine, die in Erinnerung bleiben."
      seoTitle="Veranstaltungen Ingolstadt – Galas, Konzerte & Brunch | Hotel Der Heidehof"
      metaDescription="Veranstaltungen im 4★ Superior Hotel Der Heidehof Ingolstadt: Galadinner, Live-Konzerte, Brunch, Wein-Tastings und Saisonfeste. Die nächsten Termine — jetzt Plätze sichern."
      eyebrow="Events · Galas · Live-Musik · Ingolstadt"
      heroImage="/heidehof/veranstaltungen-hero.jpg"
      heroSlug="veranstaltungen-hero"
      intro="Galadinner, Live-Konzerte, Sonntagsbrunch und Saisonfeste — das kulturelle Programm im Heidehof. Reservierung empfohlen."
      breadcrumbs={[{ name: "Veranstaltungen", path: "/veranstaltungen" }]}
      keywords={["Events", "Veranstaltungen", "Heidehof", "Gala", "Live-Musik"]}
    >
      {sortedEvents.length === 0 ? (
        <section className="py-24 text-center">
          <p className="eyebrow-cine mb-6 justify-center">
            <span className="text-gold">Aktuell ruhig</span>
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95] max-w-3xl mx-auto mb-8">
            Keine öffentlichen Veranstaltungen geplant.
          </h2>
          <p className="text-foreground/70 md:text-lg max-w-xl mx-auto mb-10">
            Planen Sie Ihre eigene Feier — wir richten den Heidehof auf Sie aus.
          </p>
          <div className="flex justify-center">
            <AskClaraButton
              context={{ category: "event", topic: "Private Feier", source: "/veranstaltungen", trigger: "events-empty" }}
              label="Private Feier mit Clara anfragen"
            />
          </div>
        </section>
      ) : (
        <div className="space-y-0">
          {sortedEvents.map((e, i) => {
            const reverse = i % 2 === 1;
            const typeLabel = EVENT_TYPE_LABEL[e.event_type] ?? e.event_type.replace(/_/g, " ");
            const dateStr = fmtDate(e.starts_at);
            const timeStr = fmtTime(e.starts_at);
            const dayStr = fmtDay(e.starts_at);
            const ctx = {
              topic: e.title,
              category: "event" as const,
              source: "/veranstaltungen",
              details: [
                e.subtitle ?? undefined,
                dateStr ?? undefined,
                e.location ?? undefined,
                e.price_label ?? undefined,
              ].filter(Boolean) as string[],
            };
            const infoBoxes: { icon: typeof Calendar; label: string }[] = [];
            if (e.tags && e.tags[0]) infoBoxes.push({ icon: Sparkles, label: e.tags[0] });
            if (e.tags && e.tags[1]) infoBoxes.push({ icon: Utensils, label: e.tags[1] });
            if (timeStr) infoBoxes.push({ icon: Clock, label: `${dayStr ? dayStr.slice(0,2) + ". " : ""}${timeStr} Uhr` });
            if (e.price_label) infoBoxes.push({ icon: Star, label: e.price_label });
            if (e.location && infoBoxes.length < 4) infoBoxes.push({ icon: MapPin, label: e.location });
            if (e.capacity && infoBoxes.length < 4) infoBoxes.push({ icon: Users, label: `max. ${e.capacity} Gäste` });

            return (
              <article
                key={e.id}
                id={e.slug}
                className="reveal-up relative min-h-screen flex items-center py-16 lg:py-24 border-t border-gold/15 first:border-t-0"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center w-full">
                  {/* TEXT */}
                  <div className={`w-full lg:max-w-[640px] ${reverse ? "lg:order-2" : "lg:order-1"}`}>
                    <p className="eyebrow-cine !mb-5 !text-gold uppercase tracking-[0.3em] text-xs">{typeLabel}</p>
                    <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-[0.95] tracking-tight">
                      {e.title}.
                    </h2>

                    {/* DATE highlight */}
                    {dateStr && (
                      <div className="inline-flex items-center gap-4 mb-7 border border-gold/30 bg-gold/5 px-5 py-3">
                        <Calendar className="w-5 h-5 text-gold shrink-0" />
                        <div>
                          <div className="font-serif text-xl md:text-2xl text-foreground leading-none">
                            {dateStr}
                          </div>
                          {timeStr && (
                            <div className="text-xs uppercase tracking-[0.25em] text-gold/80 mt-1.5">
                              {dayStr} · {timeStr} Uhr{e.ends_at ? ` – ${fmtTime(e.ends_at)} Uhr` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {e.description_md && (
                      <p className="text-[#F5F0E8]/80 leading-relaxed mb-8 text-base md:text-lg whitespace-pre-line">
                        {e.description_md}
                      </p>
                    )}

                    {/* Info grid */}
                    {infoBoxes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {infoBoxes.slice(0, 4).map((box, idx) => {
                          const Icon = box.icon;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 border border-gold/20 bg-background/40 px-4 py-3.5 text-sm text-foreground/85"
                            >
                              <Icon className="w-4 h-4 text-gold/80 shrink-0" />
                              <span>{box.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <AskClaraButton
                      context={ctx}
                      variant="block"
                      label={e.booking_enabled ? "Platz mit Clara reservieren" : "Mit Clara anfragen"}
                      className="h-12 px-8 whitespace-nowrap"
                    />
                  </div>

                  {/* IMAGE */}
                  <div
                    className={`relative aspect-[5/4] lg:aspect-[6/5] overflow-hidden cine-card border border-gold/15 group w-full ${
                      reverse ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    {e.hero_image_url ? (
                      <img
                        src={e.hero_image_url}
                        alt={e.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:1800ms] ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gold/30 bg-gradient-to-br from-stone-900 to-stone-950">
                        <PartyPopper className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />
                    {/* Overlay label – top left */}
                    {(e.subtitle || typeLabel) && (
                      <div className="absolute top-6 left-6 flex items-stretch gap-3 text-[11px] tracking-[0.3em] uppercase text-foreground/90">
                        <span className="w-px bg-gold/80" />
                        <span className="self-center">{e.subtitle ?? typeLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SubPageLayout>
  );
};

export default Veranstaltungen;
