import { SubPageLayout } from "@/components/site/SubPageLayout";
import { SiteImage } from "@/components/site/SiteImage";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

interface EditorialItem {
  slug: string;
  fb: string;
  eyebrow: string;
  title: string;
  body: string;
  meta?: string;
  href?: string;
}

const teamevents: EditorialItem[] = [
  { slug: "outdoor-hochseil", fb: "/heidehof/outdoor.jpg", eyebrow: "Teamevent", title: "Hochseilgarten-Abenteuer", body: "Vertrauen, Mut und Teamwork in luftiger Höhe — moderiert durch erfahrene Trainer von Simply Outdoor.", meta: "Halbtages-Programm" },
  { slug: "outdoor-klettern", fb: "/heidehof/outdoor.jpg", eyebrow: "Teamevent", title: "Klettertouren", body: "Geführte Touren in der Region rund um Ingolstadt — Anfänger und Fortgeschrittene willkommen.", meta: "Ganztages-Programm" },
  { slug: "outdoor-survival", fb: "/heidehof/outdoor.jpg", eyebrow: "Teamevent", title: "Survival-Training", body: "Outdoor-Skills, Naturerfahrung und Teamdynamik — ein intensives Erlebnis abseits des Konferenzraums.", meta: "Mehrtägig möglich" },
  { slug: "outdoor-team", fb: "/heidehof/outdoor.jpg", eyebrow: "Teamevent", title: "Moderierte Teamevents", body: "Workshops und Teambuilding-Aktivitäten, individuell auf Ihre Gruppe und Ihre Ziele zugeschnitten.", meta: "Nach Vereinbarung" },
];

const highlights: EditorialItem[] = [
  { slug: "audi-forum", fb: "/heidehof/orig/hero-conference.jpg", eyebrow: "Automobil-Ikone · 3 km", title: "Audi Forum & museum mobile", body: "Direkt vor unserer Tür: das Audi Forum Ingolstadt mit dem legendären museum mobile, Werksführungen durch die Audi-Produktion und exklusiven Fahrzeugausstellungen. Perfekt als Incentive nach der Tagung oder als Programmpunkt für Geschäftsreisende mit Benzin im Blut.", meta: "5 Min. Fahrt", href: "https://www.audi.de/de/foundme/de/erlebniswelten/audi-forum-ingolstadt.html" },
  { slug: "ingolstadt-village", fb: "/heidehof/orig/hotel-impression.jpg", eyebrow: "Luxus-Outlet · 10 km", title: "Ingolstadt Village", body: "Über 110 internationale Designer-Boutiquen mit ganzjährigen Reduzierungen bis zu 60 %. Gucci, Prada, Hugo Boss, Burberry & Co. — das Premium-Shopping-Erlebnis Süddeutschlands. Wir organisieren auf Wunsch Shuttle-Service und VIP-Hospitality-Pakete.", meta: "12 Min. Fahrt", href: "https://www.thebicestercollection.com/ingolstadt-village/de" },
  { slug: "westpark-ingolstadt", fb: "/heidehof/orig/hotel-impression.jpg", eyebrow: "Shopping-Mall · 3 km", title: "Westpark Einkaufszentrum", body: "Die zweite Shopping-Adresse: 140 Geschäfte, Gastronomie und Cinestar-Kino unter einem Dach. Ideal für individuelle Freizeit zwischen den Workshop-Tagen oder als kompakter Treffpunkt für Begleitpersonen.", meta: "5 Min. Fahrt", href: "https://www.westpark-ingolstadt.de" },
  { slug: "ingolstadt-altstadt", fb: "/heidehof/orig/hotel-impression.jpg", eyebrow: "Historisches Zentrum · 6 km", title: "Altstadt Ingolstadt", body: "Neues Schloss, Asamkirche, Liebfrauenmünster, Kreuztor, das Bayerische Armeemuseum und das Deutsche Medizinhistorische Museum. Eine geführte Altstadt-Tour ist der perfekte kulturelle Kontrapunkt zum Tagungsalltag.", meta: "10 Min. Fahrt" },
  { slug: "altmuehltal", fb: "/heidehof/outdoor.jpg", eyebrow: "Naturpark · 15 km", title: "Naturpark Altmühltal", body: "Einer der schönsten Naturparks Deutschlands: Wander- und Radwege entlang der Altmühl, der römische Limes, Felsformationen und Kanutouren. Wir kombinieren Naturerlebnisse gerne mit moderierten Teamevents von Simply Outdoor.", meta: "20 Min. Fahrt" },
  { slug: "baggersee", fb: "/heidehof/outdoor.jpg", eyebrow: "Sommer-Highlight · 8 km", title: "Baggersee Ingolstadt", body: "Glasklarer Badesee mit Rundweg, Beachvolleyball und Liegewiesen — die kürzeste Auszeit zwischen zwei Workshop-Sessions im Sommer.", meta: "10 Min. Fahrt" },
];

interface EditorialRowProps {
  item: EditorialItem;
  index: number;
  category: "event";
  source: string;
}

const EditorialRow = ({ item, index, category, source }: EditorialRowProps) => {
  const reverse = index % 2 === 1;
  const ctx = {
    category,
    topic: item.title,
    source,
    details: [item.eyebrow, item.meta].filter(Boolean) as string[],
  };
  return (
    <article id={item.slug} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className={`relative aspect-[4/5] overflow-hidden cine-card w-full ${reverse ? "lg:order-2" : ""}`}>
        <SiteImage slug={item.slug} fallback={item.fb} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className={`w-full ${reverse ? "lg:order-1" : ""}`}>
        <p className="eyebrow-cine mb-5">
          <span className="text-gold">{item.eyebrow}</span>
        </p>
        <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-8">
          {item.title}
        </h2>
        <p className="text-lg md:text-xl text-foreground/75 leading-relaxed mb-8 max-w-xl">
          {item.body}
        </p>
        {item.meta && (
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/55 mb-8">
            {item.meta}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-6">
          <AskClaraButton context={ctx} />
          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gold text-xs uppercase tracking-[0.3em] border-b border-gold/40 pb-1 hover:border-gold transition-colors"
            >
              Mehr erfahren <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

const OutdoorAktiv = () => (
  <SubPageLayout
    title="Teamevents Ingolstadt."
    titleAccent="Tagen unter freiem Himmel im Altmühltal."
    seoTitle="Teamevents Ingolstadt & Outdoor-Tagungen Altmühltal | Heidehof"
    metaDescription="Teamevents Ingolstadt im Altmühltal: Tagungsterrassen, Hochseilgarten, Floßbau, Bogenschießen, Survival-Trainings. Outdoor-Tagungen mit Simply Outdoor – direkt am 4★ Superior Hotel Der Heidehof."
    eyebrow="Outdoor · Incentive · Altmühltal"
    heroSlug="hero-outdoor"
    heroImage="/heidehof/outdoor.jpg"
    intro="Tagen unter freiem Himmel. Hochseilgarten, Floßbau, Teamevents im Altmühltal."
    keywords={[
      "Teamevent Ingolstadt", "Incentive Ingolstadt", "Outdoor Tagung Bayern",
      "Altmühltal Teamevent", "Firmenausflug Ingolstadt", "Hochseilgarten Ingolstadt",
      "Hotel Der Heidehof", "Simply Outdoor Ingolstadt"
    ]}
    breadcrumbs={[{ name: "Outdoor & Aktiv", path: "/outdoor-aktiv" }]}
    ctaImageSlug="cta-clara-outdoor-bg"
  >
    {/* ── Intro-Statement ── */}
    <section className="mb-24">
      <p className="eyebrow-cine mb-6">
        <span className="text-gold">Prolog</span>
      </p>
      <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight max-w-4xl">
        Nach einer Tagung in Ingolstadt sprudeln die Ideen <span className="italic text-gold">nur so</span>.
      </h2>
      <p className="mt-10 text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl">
        Zwei Tagungsterrassen, eine angrenzende Parkanlage und das gesamte Altmühltal als verlängerte Bühne. Outdoor-Tagungen organisieren wir mit{" "}
        <a href="https://www.simply-outdoor.de/" target="_blank" rel="noopener noreferrer" className="text-gold border-b border-gold/40 hover:border-gold">Simply Outdoor</a>{" "}
        — individuell, moderiert, unvergesslich.
      </p>
    </section>

    {/* ── Teamevents als 50/50-Rows ── */}
    <section className="border-t border-gold/15 pt-20">
      <p className="eyebrow-cine mb-6 text-center">
        <span className="text-gold">Teamevents</span>
      </p>
      <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-20 leading-[0.95]">
        Erlebnisse mit Simply Outdoor
      </h2>
      <div className="space-y-24 md:space-y-32">
        {teamevents.map((t, i) => (
          <EditorialRow key={t.slug} item={t} index={i} category="event" source="/outdoor-aktiv" />
        ))}
      </div>
    </section>

    {/* ── Highlights der Region ── */}
    <section className="mt-32 pt-20 border-t border-gold/15">
      <p className="eyebrow-cine mb-6 text-center">
        <span className="text-gold">Highlights der Region</span>
      </p>
      <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-12 leading-[0.95]">
        Mehr als ein Tagungshotel.<br />
        <span className="italic text-gold">Ein Standort mit Strahlkraft.</span>
      </h2>
      <p className="text-foreground/70 md:text-lg leading-relaxed max-w-2xl mx-auto text-center mb-24">
        Audi-DNA, Luxus-Outlet und Naturpark Altmühltal in unmittelbarer Reichweite — alles unter 20 Minuten Fahrzeit vom Heidehof.
      </p>

      <div className="space-y-24 md:space-y-32">
        {highlights.map((h, i) => (
          <EditorialRow key={h.slug} item={h} index={i} category="event" source="/outdoor-aktiv" />
        ))}
      </div>
    </section>

    {/* ── Editorial Nav-Liste statt Pill-Buttons ── */}
    <section className="mt-32 pt-16 border-t border-gold/15">
      <p className="eyebrow-cine mb-10 text-center">
        <span className="text-gold">Passend dazu im Heidehof</span>
      </p>
      <ul className="divide-y divide-gold/15 border-t border-b border-gold/15 max-w-3xl mx-auto">
        {[
          { to: "/tagungspauschalen", label: "Tagungspauschalen ab 69 €" },
          { to: "/tagungsraeume", label: "8 Tagungsräume bis 150 Personen" },
          { to: "/ausstattung-technik", label: "Hybrid-Technik & Ausstattung" },
          { clara: true, label: "Incentive-Programm mit Clara anfragen" },
          { to: "/", label: "Zur Hotelübersicht" },
        ].map((l) =>
          l.clara ? (
            <li key={l.label}>
              <button
                type="button"
                onClick={() => openClaraBubble({ category: "event", topic: "Incentive-Programm", source: "/outdoor-aktiv", trigger: "outdoor-cta" })}
                className="group w-full flex items-center justify-between py-6 px-2 -mx-2 hover:bg-gold/[0.04] transition-colors text-left"
              >
                <span className="font-serif text-xl md:text-2xl text-foreground/90 group-hover:text-foreground">{l.label}</span>
                <ArrowUpRight className="w-5 h-5 text-gold/60 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </button>
            </li>
          ) : (
            <li key={l.to}>
              <Link
                to={l.to!}
                className="group w-full flex items-center justify-between py-6 px-2 -mx-2 hover:bg-gold/[0.04] transition-colors"
              >
                <span className="font-serif text-xl md:text-2xl text-foreground/90 group-hover:text-foreground">{l.label}</span>
                <ArrowUpRight className="w-5 h-5 text-gold/60 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </Link>
            </li>
          )
        )}
      </ul>
    </section>
  </SubPageLayout>
);

export default OutdoorAktiv;
