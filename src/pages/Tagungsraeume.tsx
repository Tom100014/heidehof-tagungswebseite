import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { faqSchema, meetingRoomListSchema } from "@/lib/seo/schemas";
import { slugifyRoom } from "@/lib/clara/site-tour";
import { fetchRooms, type ConferenceRoom } from "@/services/conference/rooms-service";
import { supabase } from "@/integrations/supabase/client";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { Presentation, Users, Square, RectangleHorizontal, UtensilsCrossed, User } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Tagungsräume – editorial, Rolls-Royce register.
   ───────────────────────────────────────────────────────────────────── */

const SETUP_LABELS: Array<{ key: keyof ConferenceRoom; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
  { key: "cap_theater", label: "Theater", Icon: Presentation },
  { key: "cap_parlament", label: "Parlament", Icon: Users },
  { key: "cap_uform", label: "U-Form", Icon: RectangleHorizontal },
  { key: "cap_block", label: "Block", Icon: Square },
  { key: "cap_bankett", label: "Bankett", Icon: UtensilsCrossed },
];


interface ImpressionImage {
  id: string;
  title: string;
  image_url: string;
  caption: string | null;
}

const FALLBACK_SALONS: ImpressionImage[] = [
  { id: "fallback-1", title: "Salon Schiller", image_url: "/heidehof/salon-schiller.jpg", caption: null },
  { id: "fallback-2", title: "Salon Goethe", image_url: "/heidehof/salon-goethe.jpg", caption: null },
  { id: "fallback-3", title: "Salon Lessing", image_url: "/heidehof/salon-lessing.jpg", caption: null },
  { id: "fallback-4", title: "Salon Hölderlin", image_url: "/heidehof/salon-hoelderlin.jpg", caption: null },
  { id: "fallback-5", title: "Heidehof-Saal", image_url: "/heidehof/saal-heidehof.jpg", caption: null },
];

const roomFaqs = [
  {
    q: "Welche Tagungsräume gibt es im Hotel Der Heidehof?",
    a: "Der Heidehof bietet acht flexible Tagungs- und Konferenzräume in Ingolstadt, darunter das Tagungscenter mit kombinierbaren Räumen sowie das Art Center für kleinere Seminare und Workshops.",
  },
  {
    q: "Für wie viele Personen sind die Tagungsräume geeignet?",
    a: "Je nach Bestuhlung eignen sich die Räume für kleine Meetings, Seminare, Workshops und Veranstaltungen bis etwa 150 Personen.",
  },
  {
    q: "Können mehrere Räume miteinander kombiniert werden?",
    a: "Ja. Besonders Bonn und Berlin können zu einer größeren Fläche kombiniert werden. Clara oder das Tagungsteam empfiehlt auf Wunsch den passenden Raum nach Personenanzahl, Bestuhlung und Ablauf.",
  },
  {
    q: "Welche Technik ist in den Tagungsräumen verfügbar?",
    a: "Die Räume verfügen über Tageslicht, WLAN, Präsentationstechnik und klassische Konferenztechnik. Zusätzliche Technik wird passend zur Veranstaltung geplant.",
  },
];

const fmt = (n: number | null) => (n == null ? "—" : n.toString().replace(".", ","));
const pad2 = (n: number) => n.toString().padStart(2, "0");

const toRoman = (n: number) => {
  const vals: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let res = "";
  for (const [v, s] of vals) {
    while (n >= v) { res += s; n -= v; }
  }
  return res;
};

/* Index removed — rooms are now presented as full-bleed cinematic chapters only. */

/* ─────────────── Editorial Section Intro – chapter mark, hairline rule,
   serif headline with italic gold accent, calibrated lede, optional meta row.
   Used as a graceful transition between cinematic chapters.            ─── */

interface SectionIntroProps {
  chapter: string;
  eyebrow: string;
  headline: string;
  accent: string;
  lede?: React.ReactNode;
  meta?: Array<{ label: string; value: string }>;
}

const SectionIntro = ({ chapter, eyebrow, headline, accent, lede, meta }: SectionIntroProps) => (
  <header className="reveal-up relative">
    {/* Soft fade-in from previous image into the dark band */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-24 md:-top-32 h-24 md:h-32 bg-gradient-to-b from-transparent via-[#0e0e10]/70 to-[#0e0e10]"
    />

    {/* Top hairline with chapter + eyebrow inline — editorial, never floating */}
    <div className="flex items-center gap-5 pb-6 border-t border-white/10 pt-6">
      <span
        className="text-gold/80 text-[11px] tracking-[0.45em] uppercase font-medium tabular-nums"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", letterSpacing: "0.25em" }}
      >
        Kapitel&nbsp;{chapter}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-gold/40 via-white/8 to-transparent" />
      <span className="text-[10px] uppercase tracking-[0.5em] text-gold/85 font-medium">
        {eyebrow}
      </span>
    </div>

    {/* Headline — left aligned, generous but compact */}
    <div className="max-w-[64rem]">
      <h2
        className="text-foreground text-4xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.02] tracking-tight font-light"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        <span className="block">{headline}</span>
        <span className="block italic text-gold/90">{accent}</span>
      </h2>

      {lede && (
        <p className="mt-7 text-foreground/90 text-base md:text-lg leading-[1.75] max-w-[60ch] font-light">
          {lede}
        </p>
      )}
    </div>

    {/* Spec bar — clean horizontal, hairline above, dividers between */}
    {meta && meta.length > 0 && (
      <dl className="mt-10 grid grid-flow-col auto-cols-max gap-x-10 md:gap-x-14 pt-6 border-t border-white/10">
        {meta.map((m, i) => (
          <div
            key={m.label}
            className={
              i > 0
                ? "pl-10 md:pl-14 border-l border-white/8 flex flex-col gap-1.5"
                : "flex flex-col gap-1.5"
            }
          >
            <dt className="text-[10px] uppercase tracking-[0.4em] text-gold/85 font-medium">
              {m.label}
            </dt>
            <dd
              className="text-foreground/95 text-lg md:text-xl font-light italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    )}
    {/* Soft fade-out from the dark band into the next image */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -bottom-24 md:-bottom-32 h-24 md:h-32 bg-gradient-to-b from-[#0a0a0c] via-[#0a0a0c]/70 to-transparent"
    />
  </header>
);





/* ─────────────── Cinematic Chapter — full-bleed image + glass panel ─────────────── */

const RoomChapter = ({ r, number }: { r: ConferenceRoom; number: number }) => {
  const slug = slugifyRoom(r.name);
  const dims = [r.length_m, r.width_m, r.height_m].every((v) => v != null)
    ? `${fmt(r.length_m)} × ${fmt(r.width_m)} × ${fmt(r.height_m)} m`
    : null;
  const setups = SETUP_LABELS.filter((s) => (r[s.key] as number | null) != null);
  const isReversed = number % 2 === 0;

  const ctx = {
    category: "tagung" as const,
    topic: `Raum ${r.name}`,
    room: r.name,
    area_sqm: r.area_sqm,
    capacity: r.capacity,
    source: "tagungsraeume",
    details: [r.subtitle ?? "", r.area_sqm != null ? `${r.area_sqm} m²` : ""].filter(Boolean),
  };

  return (
    <article
      id={`raum-${slug}`}
      data-clara-anchor
      data-clara-target={`raum-${slug}`}
      className="relative isolate min-h-[100svh] overflow-hidden flex items-center w-screen left-1/2 -translate-x-1/2"
    >

      {/* Full-bleed image */}
      <div className="absolute inset-0 -z-10">
        {r.image_url ? (
          <img
            src={r.image_url}
            alt={r.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-[1.02] transition-transform [transition-duration:2400ms] ease-out hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950" />
        )}
        {/* Directional cinematic gradient — leaves the image side bright */}
        <div
          className={`absolute inset-0 ${
            isReversed
              ? "bg-gradient-to-l from-black/85 via-black/40 to-black/5"
              : "bg-gradient-to-r from-black/85 via-black/40 to-black/5"
          }`}
        />
        {/* Soft warm vignette for freshness */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_120%,hsl(45_55%_55%/0.18),transparent_55%)]" />
      </div>

      {/* Chapter mark — top corner */}
      <div className="absolute top-10 md:top-14 left-6 md:left-12 z-10">
        <span className="text-[10px] uppercase tracking-[0.5em] text-gold/90 font-medium">
          {r.subtitle || "Tagungsraum"}
        </span>
      </div>

      {/* Glass content panel */}
      <div className="w-full px-6 md:px-12 lg:px-20 py-24 md:py-28">
        <div className={`max-w-2xl relative ${isReversed ? "ml-auto" : ""}`}>
          <div
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] p-8 md:p-12"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-px rounded-[15px] ring-1 ring-inset ring-white/5" />

            <h3 className="font-serif text-5xl md:text-6xl xl:text-7xl text-white mb-6 leading-[0.95] tracking-tight">
              {r.name}
            </h3>

            {r.description && (
              <p className="text-white/85 leading-[1.7] mb-10 text-base md:text-lg max-w-[46ch] font-light">
                {r.description}
              </p>
            )}

            <dl className="border-t border-white/10 divide-y divide-white/5 mb-8">
              {r.area_sqm != null && (
                <div className="grid grid-cols-[8rem_1fr] py-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/90 self-center">Fläche</dt>
                  <dd className="font-serif text-xl md:text-2xl text-white">{fmt(r.area_sqm)} m²</dd>
                </div>
              )}
              {dims && (
                <div className="grid grid-cols-[8rem_1fr] py-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/90 self-center">Dimension</dt>
                  <dd className="font-serif text-xl md:text-2xl text-white">{dims}</dd>
                </div>
              )}
              {r.capacity != null && (
                <div className="grid grid-cols-[8rem_1fr] py-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/90 self-center">Kapazität</dt>
                  <dd className="font-serif text-xl md:text-2xl text-white">bis {r.capacity} Pers.</dd>
                </div>
              )}
            </dl>

            {setups.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] uppercase tracking-[0.5em] text-gold/90 mb-4">Bestuhlung · Personen</p>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {setups.map((s) => {
                    const Icon = s.Icon;
                    return (
                      <div
                        key={String(s.key)}
                        className="group rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur px-2 py-3 text-center hover:bg-white/[0.08] transition-colors"
                        title={`${s.label} – ${r[s.key]} Personen`}
                      >
                        <Icon className="mx-auto h-4 w-4 text-gold/80 mb-1.5" strokeWidth={1.5} />
                        <div className="flex items-center justify-center gap-1 leading-none">
                          <span className="font-serif text-2xl md:text-[26px] text-white">
                            {r[s.key] as number}
                          </span>
                          <User className="h-3 w-3 text-white/60" strokeWidth={1.75} />
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-white/70 mt-2 font-medium">
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/50 mt-3 italic">Alle Werte = max. Personenzahl je Bestuhlungsform</p>
              </div>
            )}


            <AskClaraButton
              context={ctx}
              variant="block"
              label="Mit Clara anfragen"
              className="h-12 px-8 whitespace-nowrap"
            />
          </div>

        </div>
      </div>
    </article>
  );
};

/* ─────────────── Page ─────────────── */

const Tagungsraeume = () => {
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<ImpressionImage[]>(FALLBACK_SALONS);

  useEffect(() => {
    const reload = () =>
      fetchRooms()
        .then((data) => setRooms(data.filter((r) => r.is_active)))
        .catch(() => setRooms([]))
        .finally(() => setLoading(false));
    reload();

    const loadImpressions = () =>
      supabase
        .from("impressionen_images")
        .select("id,title,image_url,caption")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .then(({ data, error }) => {
          if (error || !data || data.length === 0) return;
          setSalons(data as ImpressionImage[]);
        });
    void loadImpressions();

    const channel = supabase
      .channel("public-conference-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_rooms" }, () =>
        reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impressionen_images" },
        () => loadImpressions(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const tagungscenter = useMemo(
    () => rooms.filter((r) => r.category === "tagungscenter"),
    [rooms],
  );
  const artCenter = useMemo(() => rooms.filter((r) => r.category === "art-center"), [rooms]);
  const allRooms = useMemo(() => [...tagungscenter, ...artCenter], [tagungscenter, artCenter]);
  const meetingRoomSchemaItems = useMemo(
    () =>
      allRooms.map((room) => ({
        name: room.name,
        area: String(room.area_sqm ?? 0),
        capTheater: room.cap_theater ?? room.capacity ?? 0,
        capBanquet: room.cap_bankett ?? room.capacity ?? 0,
        image: room.image_url?.startsWith("/") ? room.image_url : undefined,
      })),
    [allRooms],
  );


  return (
    <SubPageLayout
      title="Tagungsräume Ingolstadt."
      titleAccent="Acht Räume. Acht Charaktere."
      seoTitle="Tagungsräume Ingolstadt mieten – 8 Konferenzräume bis 150 Personen | Hotel Der Heidehof"
      metaDescription="Tagungshotel Ingolstadt: 8 flexible Tagungs- und Konferenzräume von 35 bis 120 m², Tageslicht, modernste Konferenztechnik, Tagungspauschale ab 69 € p.P. – inkl. Verpflegung, 120 kostenfreie Parkplätze, 10 Min. von Audi & A9. Jetzt unverbindlich anfragen."
      eyebrow="Bankett & Tagung · 4★ Superior · Ingolstadt"
      heroSlug="hero-tagungsraeume"
      heroImage="/heidehof/saal-heidehof.jpg"
      intro="8 Räume. 35 – 120 m². Tageslicht, Hybrid-Technik, persönliche Betreuung. 10 Minuten von Audi und der A9."
      heroSpecs={[
        { label: "Räume", value: "8 · flexibel kombinierbar" },
        { label: "Fläche", value: "35 – 120 m² · 435 m² gesamt" },
        { label: "Kapazität", value: "bis 150 Personen" },
        { label: "Pauschale", value: "ab 69 € p. P." },

      ]}
      keywords={[
        "Tagungsräume Ingolstadt",
        "Tagungshotel Ingolstadt",
        "Konferenzraum Ingolstadt mieten",
        "Seminarraum Ingolstadt",
        "Bankett Ingolstadt",
        "Tagung Audi Ingolstadt",
        "Tagungspauschale Ingolstadt",
        "Meeting Location Ingolstadt",
        "Workshop Räume Ingolstadt",
        "Hotel Der Heidehof",
      ]}
      breadcrumbs={[{ name: "Tagungsräume", path: "/tagungsraeume" }]}
      ctaImageSlug="cta-clara-tagungsraeume-bg"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "EventVenue",
          name: "Hotel Der Heidehof – Tagungscenter Ingolstadt",
          url: "https://hotel-der-heidehof.de/tagungsraeume",
          telephone: "+49 8458 64590",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Ingolstadt",
            addressRegion: "BY",
            addressCountry: "DE",
          },
        },
        meetingRoomListSchema(meetingRoomSchemaItems),
        faqSchema(roomFaqs),
      ]}
    >
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gradient-to-b from-[#0e0e10] via-[#121214] to-[#0a0a0c]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-12">



        {loading ? (
          <div className="text-center text-muted-foreground py-32">Räume werden geladen…</div>
        ) : (
          <>
            {tagungscenter.length > 0 && (

              <section id="tagungscenter" data-clara-anchor className="relative pt-10 md:pt-14 pb-0">

                <SectionIntro
                  chapter="I"
                  eyebrow="Tagungscenter"
                  headline="Fünf Räume,"
                  accent="flexibel kombinierbar."
                  lede={
                    <>
                      Bonn und Berlin lassen sich zum größten Tagungsraum{" "}
                      <span className="text-foreground/95">Bonn / Berlin (120 m²)</span> zusammenlegen –
                      für Vorträge, Plenum und Galaabende in einer einzigen, ruhigen Geste.
                    </>
                  }
                  meta={[
                    { label: "Räume", value: `${tagungscenter.length} Salons` },
                    { label: "Fläche", value: "bis 120 m²" },
                    { label: "Kapazität", value: "bis 100 Gäste" },
                  ]}
                />
                <div className="mt-10 md:mt-14">
                  {tagungscenter.map((r, i) => (
                    <RoomChapter key={r.id} r={r} number={i + 1} />
                  ))}
                </div>
              </section>
            )}

            {artCenter.length > 0 && (
              <section id="art-center" data-clara-anchor className="relative pt-20 md:pt-32 pb-0">

                <SectionIntro
                  chapter="II"
                  eyebrow="Art Center"
                  headline="Drei Elemente."
                  accent="Drei Kreativräume."
                  lede={
                    <>
                      <span className="text-foreground/95">Feuer</span> (42 m²),{" "}
                      <span className="text-foreground/95">Wasser</span> (38 m²) und{" "}
                      <span className="text-foreground/95">Holz</span> (35 m²) –
                      Räume für Workshops, Klausuren und Formate, die das klassische Konferenzraster verlassen.
                    </>
                  }
                  meta={[
                    { label: "Konzept", value: "Elementar" },
                    { label: "Räume", value: "3 Kreativ-Salons" },
                    { label: "Eignung", value: "Workshops · Klausur" },
                  ]}
                />
                <div className="mt-10 md:mt-14">
                  {artCenter.map((r, i) => (
                    <RoomChapter key={r.id} r={r} number={tagungscenter.length + i + 1} />
                  ))}
                </div>
              </section>
            )}


          </>
        )}

        {/* Atmosphere – masonry-ish editorial gallery */}
        <section id="impressionen" data-clara-anchor className="relative pt-20 md:pt-32 pb-8 md:pb-16">

          <SectionIntro

            chapter="III"
            eyebrow="Impressionen"
            headline="Atmosphäre"
            accent="erleben."
            lede={
              <>
                Eine kuratierte Folge aus Licht, Material und Stille –
                <span className="text-foreground/95"> kein Stock, keine Inszenierung.</span> Nur unsere Räume, so wie sie sind.
              </>
            }
          />
          <div className="grid grid-cols-12 gap-3 md:gap-5">

            {salons.map((s, idx) => {
              // editorial rhythm: large / small / small / large / small / small …
              const isFeature = idx % 3 === 0;
              return (
                <figure
                  key={s.id}
                  className={`relative overflow-hidden group ${
                    isFeature
                      ? "col-span-12 md:col-span-8 aspect-[16/10]"
                      : "col-span-6 md:col-span-4 aspect-[4/5]"
                  }`}
                >
                  <img
                    src={s.image_url}
                    alt={s.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:2000ms] ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-gold/15 pointer-events-none" />
                  <figcaption className="absolute left-0 right-0 bottom-0 p-5 md:p-7">
                    <span className="block text-[10px] uppercase tracking-[0.4em] text-gold/80 mb-2">
                      {pad2(idx + 1)}
                    </span>
                    <span className="block font-serif text-xl md:text-2xl text-[#F5F0E8] leading-tight">
                      {s.title}
                    </span>
                    {s.caption && (
                      <span className="block text-xs text-[#F5F0E8]/70 mt-1">{s.caption}</span>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>

        {/* Quiet closing line */}
        <section className="relative border-t border-gold/25 pt-16 md:pt-20 pb-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left: Headline */}
            <div className="lg:col-span-7">
              <p className="text-[10px] uppercase tracking-[0.5em] text-gold/70 mb-4">
                Anfrage
              </p>
              <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-[1.05] tracking-tight mb-8">
                Sprechen Sie mit Clara<br />
                <span className="italic text-gold/90">— oder direkt mit uns.</span>
              </h2>
              <p className="text-[#F5F0E8]/70 text-base md:text-lg leading-[1.7] max-w-[50ch]">
                Unser Bankett-Team berät Sie persönlich zu Raumwahl, Bestuhlung, Catering und
                Übernachtung — werktags und am Wochenende.
              </p>
              <div className="mt-8">
                <Link
                  to="/tagungspauschalen"
                  className="inline-flex items-center h-12 px-8 border border-gold/40 text-gold hover:bg-gold/10 transition-colors text-[11px] uppercase tracking-[0.4em]"
                >
                  Pauschalen ansehen
                </Link>
              </div>
            </div>

            {/* Right: Contact info + Clara button */}
            <aside className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-gold/25">
              <p className="text-[10px] uppercase tracking-[0.5em] text-gold/70 mb-6">
                Direkter Kontakt
              </p>
              <dl className="border-t border-gold/25 divide-y divide-gold/25 mb-8">
                <div className="grid grid-cols-[6rem_1fr] py-4">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/70 self-center">
                    Telefon
                  </dt>
                  <dd className="font-serif text-lg md:text-xl text-foreground">
                    <a
                      href="tel:+498458645590"
                      className="hover:text-gold transition-colors"
                    >
                      +49 8458 64-590
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr] py-4">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/70 self-center">
                    E-Mail
                  </dt>
                  <dd className="font-serif text-lg md:text-xl text-foreground break-all">
                    <a
                      href="mailto:bankett@der-heidehof.de"
                      className="hover:text-gold transition-colors"
                    >
                      bankett@der-heidehof.de
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr] py-4">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/70 self-center">
                    Adresse
                  </dt>
                  <dd className="font-serif text-base md:text-lg text-foreground leading-snug">
                    Ingolstädter Str. 121<br />
                    85080 Gaimersheim · Ingolstadt
                  </dd>
                </div>

                <div className="grid grid-cols-[6rem_1fr] py-4">
                  <dt className="text-[10px] uppercase tracking-[0.35em] text-gold/70 self-center">
                    Zeiten
                  </dt>
                  <dd className="text-[#F5F0E8]/75 text-sm leading-relaxed">
                    Mo – Fr · 08 – 18 Uhr<br />
                    Sa · 09 – 14 Uhr
                  </dd>
                </div>
              </dl>
              <AskClaraButton
                context={{ category: "tagung", topic: "Anfrage Tagungsräume", source: "tagungsraeume-foot" }}
                variant="block"
                label="Mit Clara anfragen"
                className="h-12 px-8 w-full sm:w-auto"
              />
            </aside>
          </div>
        </section>
        </div>
      </div>

    </SubPageLayout>
  );
};

export default Tagungsraeume;
