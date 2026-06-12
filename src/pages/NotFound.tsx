import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const QUICK_LINKS = [
  { to: "/tagungsraeume", label: "Tagungsräume" },
  { to: "/tagungspauschalen", label: "Pauschalen" },
  { to: "/ausstattung-technik", label: "Ausstattung" },
  { to: "/outdoor-aktiv", label: "Outdoor & Aktiv" },
  { to: "/spa", label: "Spa & Wellness" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PageSeo
        title="Seite nicht gefunden – 404 | Hotel Der Heidehof"
        description="Die gesuchte Seite existiert nicht. Hier finden Sie alle Hauptbereiche des Hotel Der Heidehof Ingolstadt."
        noindex
      />
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="text-center max-w-2xl">
          <p className="gold-hairline-pill mb-6"><span className="gold-dot" /> Fehler 404</p>
          <h1 className="font-serif text-6xl md:text-8xl mb-6 text-gold">Sackgasse.</h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Diese Seite existiert nicht – oder wurde verschoben. Hier sind die meistbesuchten Bereiche:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left">
            {QUICK_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="cine-card rounded-xl p-4 flex items-center justify-between group">
                <span className="text-sm uppercase tracking-[0.2em] text-foreground">{l.label}</span>
                <ArrowRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
          <Link to="/" className="cine-btn-ghost rounded-md inline-flex"><Home className="w-4 h-4" /> Zur Startseite</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
