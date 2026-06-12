import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Phone, Sparkles, Utensils, CalendarCheck, Waves, Wine, Map } from "lucide-react";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

type CtaConfig = {
  label: string;
  icon: typeof Phone;
  onClick: () => void;
  category: string;
};

/**
 * Sticky, route-aware mobile bottom action bar.
 * Renders below md breakpoint only. Provides 3 contextual actions:
 *   - Call hotel
 *   - Page-specific primary action (e.g. "Pauschale anfragen", "Tisch reservieren")
 *   - Open Clara
 *
 * Mounted once globally via SiteHeader to avoid per-page duplication.
 */
export const MobileBottomBar = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);

  // Hide on admin / order flow routes — they have their own footers/CTAs
  const hideOnPaths = [
    "/admin",
    "/menue-bestellung",
    "/menue-",
    "/conference",
    "/login",
  ];
  const shouldHide = hideOnPaths.some((p) => pathname.startsWith(p));

  // Hide briefly while scrolling down, show on scroll up — keeps long pages readable
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setVisible(true);
        else if (y > lastY + 8) setVisible(false);
        else if (y < lastY - 8) setVisible(true);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (shouldHide) return null;

  const claraTopicByPath = (): CtaConfig => {
    if (pathname.startsWith("/tagungspauschalen"))
      return {
        label: "Pauschale anfragen",
        icon: CalendarCheck,
        category: "tagung",
        onClick: () =>
          openClaraBubble({
            category: "tagung",
            topic: "Tagungspauschalen",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    if (pathname.startsWith("/tagungsraeume") || pathname.startsWith("/ausstattung"))
      return {
        label: "Raum anfragen",
        icon: CalendarCheck,
        category: "tagung",
        onClick: () =>
          openClaraBubble({
            category: "tagung",
            topic: "Tagungsraum",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    if (pathname.startsWith("/speisekarte"))
      return {
        label: "Tisch reservieren",
        icon: Utensils,
        category: "food",
        onClick: () =>
          openClaraBubble({
            category: "food",
            topic: "Tischreservierung",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    if (pathname.startsWith("/getraenkekarte"))
      return {
        label: "Karte anfragen",
        icon: Wine,
        category: "food",
        onClick: () =>
          openClaraBubble({
            category: "food",
            topic: "Getränkekarte",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    if (pathname.startsWith("/wellness") || pathname.startsWith("/spa"))
      return {
        label: "Spa entdecken",
        icon: Waves,
        category: "wellness",
        onClick: () =>
          openClaraBubble({
            category: "wellness",
            topic: "Spa & Wellness",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    if (pathname.startsWith("/outdoor"))
      return {
        label: "Aktiv erleben",
        icon: Map,
        category: "event",
        onClick: () =>
          openClaraBubble({
            category: "event",
            topic: "Outdoor & Aktiv",
            trigger: "mobile-bottom-bar",
            source: pathname,
          }),
      };
    return {
      label: "Tagung anfragen",
      icon: CalendarCheck,
      category: "tagung",
      onClick: () =>
        openClaraBubble({
          category: "tagung",
          topic: "Tagung oder Veranstaltung",
          trigger: "mobile-bottom-bar",
          source: pathname,
        }),
    };
  };

  const cta = claraTopicByPath();
  const CtaIcon = cta.icon;

  const bar = (
    <nav
      aria-label="Schnellzugriff"
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-3 mb-3 rounded-2xl border border-gold/25 bg-background/85 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] flex items-stretch overflow-hidden">
        <a
          href="tel:+4984586400"
          aria-label="Hotel anrufen"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-foreground/85 active:bg-white/5 transition-colors"
        >
          <Phone className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.14em]">Anrufen</span>
        </a>

        <button
          type="button"
          onClick={cta.onClick}
          aria-label={cta.label}
          className="flex-[1.4] flex flex-col items-center justify-center gap-0.5 py-2.5 bg-gradient-to-b from-gold/15 to-gold/5 text-foreground active:from-gold/20 transition-colors border-x border-gold/15"
        >
          <CtaIcon className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-medium">
            {cta.label}
          </span>
        </button>

        <Link
          to="/speisekarte"
          aria-label="Speisekarte ansehen"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-foreground/85 active:bg-white/5 transition-colors"
          onClick={(e) => {
            if (pathname.startsWith("/speisekarte")) {
              e.preventDefault();
              openClaraBubble({
                category: "food",
                topic: "Clara",
                trigger: "mobile-bottom-bar-clara",
                source: pathname,
              });
            }
          }}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.14em]">
            {pathname.startsWith("/speisekarte") ? "Clara" : "Speisekarte"}
          </span>
        </Link>
      </div>
    </nav>
  );

  // Portal to document.body: escapes any ancestor with backdrop-filter or
  // overflow:hidden that would create a new containing block for position:fixed.
  return createPortal(bar, document.body);
};

export default MobileBottomBar;
