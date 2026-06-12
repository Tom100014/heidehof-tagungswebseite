import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * PageNavigator — editorial Prev/Next navigation between public subpages.
 * Renders a wide bar with previous + next page, mirroring the editorial
 * lime/zinc vocabulary of SubPageLayout. Hidden on pages not in the order.
 */

export interface NavPage {
  path: string;
  label: string;
  eyebrow: string;
}

// Erzählerische Reihenfolge der öffentlichen Hotel-Seiten.
export const SITE_ORDER: NavPage[] = [
  { path: "/", label: "Startseite", eyebrow: "Heidehof" },
  { path: "/ein-tag-bei-uns", label: "Ein Tag bei uns", eyebrow: "Journey" },
  { path: "/tagungsraeume", label: "Tagungsräume", eyebrow: "Konferenz" },
  { path: "/tagungspauschalen", label: "Tagungspauschalen", eyebrow: "Pakete" },
  { path: "/ausstattung-technik", label: "Ausstattung & Technik", eyebrow: "Technik" },
  { path: "/veranstaltungen", label: "Veranstaltungen", eyebrow: "Bankett" },
  { path: "/outdoor-aktiv", label: "Outdoor & Aktiv", eyebrow: "Natur" },
  { path: "/wellness", label: "Wellness", eyebrow: "Wasserwelt" },
  { path: "/spa", label: "Spa & Beauty", eyebrow: "Spa" },
  { path: "/restaurant", label: "Restaurants & Bar", eyebrow: "Kulinarik" },
  { path: "/speisekarte", label: "Speisekarte", eyebrow: "Küche" },
  { path: "/getraenkekarte", label: "Getränkekarte", eyebrow: "Bar" },
];

interface PageNavigatorProps {
  /** Override the auto-detected current path. */
  currentPath?: string;
  className?: string;
}

export const PageNavigator = ({ currentPath, className = "" }: PageNavigatorProps) => {
  const location = useLocation();
  const path = currentPath ?? location.pathname;
  const idx = SITE_ORDER.findIndex((p) => p.path === path);
  if (idx === -1) return null;

  const prev = idx > 0 ? SITE_ORDER[idx - 1] : SITE_ORDER[SITE_ORDER.length - 1];
  const next = idx < SITE_ORDER.length - 1 ? SITE_ORDER[idx + 1] : SITE_ORDER[0];
  const current = SITE_ORDER[idx];

  return (
    <nav
      aria-label="Seiten-Navigation"
      className={`relative bg-zinc-950 border-t border-white/5 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] uppercase tracking-[0.4em] text-lime-500/80">
            Weiter erkunden
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 hidden sm:inline">
            {idx + 1} / {SITE_ORDER.length} · {current.eyebrow}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Previous */}
          <Link
            to={prev.path}
            className="group relative overflow-hidden border border-white/10 hover:border-lime-400/40 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm transition-all duration-300 px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-5"
          >
            <ArrowLeft className="w-4 h-4 text-lime-400/80 shrink-0 transition-transform group-hover:-translate-x-1" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 mb-1">
                Zurück · {prev.eyebrow}
              </p>
              <p
                className="text-white text-xl md:text-2xl font-light tracking-tight truncate"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {prev.label}
              </p>
            </div>
          </Link>

          {/* Next */}
          <Link
            to={next.path}
            className="group relative overflow-hidden border border-white/10 hover:border-lime-400/40 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm transition-all duration-300 px-6 sm:px-8 py-6 sm:py-7 flex items-center gap-5 md:text-right md:flex-row-reverse"
          >
            <ArrowRight className="w-4 h-4 text-lime-400/80 shrink-0 transition-transform group-hover:translate-x-1" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 mb-1">
                Weiter · {next.eyebrow}
              </p>
              <p
                className="text-white text-xl md:text-2xl font-light tracking-tight truncate"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {next.label}
              </p>
            </div>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-px w-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime-500/60 to-lime-300/30 transition-all duration-500"
            style={{ width: `${((idx + 1) / SITE_ORDER.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
};

export default PageNavigator;
