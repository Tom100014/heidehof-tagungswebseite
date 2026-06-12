import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Presentation,
  Package,
  Cpu,
  Sparkles,
  Flower2,
  UtensilsCrossed,
  Wine,
  ChefHat,
  CalendarDays,
  PartyPopper,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveEvents } from "@/hooks/use-active-events";

export interface NavItem {
  to: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  key: string;
  label: string;
  to?: string;
  items?: NavItem[];
  matchPaths?: string[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "tagung",
    label: "Tagung",
    matchPaths: ["/tagungsraeume", "/tagungspauschalen", "/ausstattung-technik", "/outdoor-aktiv"],
    items: [
      { to: "/tagungsraeume", label: "Tagungsräume", description: "Räume & Kapazitäten", icon: Presentation },
      { to: "/tagungspauschalen", label: "Pauschalen", description: "Preise & Leistungen", icon: Package },
      { to: "/ausstattung-technik", label: "Ausstattung & Technik", description: "Equipment vor Ort", icon: Cpu },
      { to: "/outdoor-aktiv", label: "Outdoor & Aktiv", description: "Teamevents & Rahmenprogramm", icon: Trees },
    ],
  },
  {
    key: "wellness",
    label: "Wellness",
    matchPaths: ["/wellness", "/spa"],
    items: [
      { to: "/wellness", label: "Wellness", description: "Pool, Sauna, Fitness", icon: Sparkles },
      { to: "/spa", label: "Spa", description: "Massagen & Treatments", icon: Flower2 },
    ],
  },
  {
    key: "gastronomie",
    label: "Gastronomie",
    matchPaths: ["/restaurant", "/speisekarte", "/getraenkekarte", "/menue-bestellung"],
    items: [
      { to: "/restaurant", label: "Restaurant", description: "Ambiente & Reservierung", icon: UtensilsCrossed },
      { to: "/speisekarte", label: "Speisekarte", description: "Küche & Menüs", icon: UtensilsCrossed },
      { to: "/getraenkekarte", label: "Getränkekarte", description: "Weine, Bar & mehr", icon: Wine },
      { to: "/menue-bestellung", label: "Menüauswahl als Gast", description: "Direkt vorab wählen", icon: ChefHat },
    ],
  },
  {
    key: "events",
    label: "Events",
    to: "/veranstaltungen",
    matchPaths: ["/veranstaltungen"],
    items: [{ to: "/veranstaltungen", label: "Übersicht", description: "Alle Veranstaltungen", icon: CalendarDays }],
  },
  {
    key: "ein-tag",
    label: "Ein Tag bei uns",
    to: "/ein-tag-bei-uns",
    matchPaths: ["/ein-tag-bei-uns"],
  },
];

const isGroupActive = (group: NavGroup, pathname: string) =>
  !!group.matchPaths?.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const formatEventDate = (iso: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  } catch {
    return null;
  }
};

interface DesktopNavProps {
  solid: boolean;
}

export const DesktopNav = ({ solid }: DesktopNavProps) => {
  const { pathname } = useLocation();
  const { data: activeEvents } = useActiveEvents();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpenKey(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scheduleOpen = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenKey(key), 90);
  };
  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 180);
  };

  const baseLink = "relative text-xs uppercase tracking-[0.25em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-1 py-1.5";
  const idleColor = solid ? "text-foreground/80 hover:text-gold" : "text-white/85 hover:text-gold";
  const activeUnderline = "after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:w-6 after:h-px after:bg-gold";

  return (
    <nav className="hidden lg:flex items-center gap-7" aria-label="Hauptnavigation">
      {NAV_GROUPS.map((group) => {
        const active = isGroupActive(group, pathname);
        const hasMenu = !!group.items?.length;

        // Events are presented on the dedicated /veranstaltungen page to avoid duplicate listings in the nav.
        const items = group.items ?? [];

        if (!hasMenu) {
          return (
            <NavLink
              key={group.key}
              to={group.to ?? "#"}
              className={({ isActive }) =>
                cn(baseLink, isActive ? `text-gold ${activeUnderline}` : idleColor)
              }
            >
              {group.label}
            </NavLink>
          );
        }

        const isOpen = openKey === group.key;
        const menuId = `nav-menu-${group.key}`;

        return (
          <div
            key={group.key}
            className="relative"
            onMouseEnter={() => scheduleOpen(group.key)}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              onClick={() => setOpenKey(isOpen ? null : group.key)}
              className={cn(
                baseLink,
                "inline-flex items-center gap-1",
                active ? `text-gold ${activeUnderline}` : idleColor,
              )}
            >
              {group.label}
              <ChevronDown
                className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")}
                aria-hidden
              />
            </button>

            <div
              id={menuId}
              role="menu"
              className={cn(
                "absolute left-1/2 -translate-x-1/2 top-full mt-3 min-w-[260px] origin-top",
                "bg-[#0a0a0c]/98 backdrop-blur-2xl border border-gold/30 rounded-xl shadow-[0_28px_70px_-15px_rgba(0,0,0,0.95)] p-2",
                "transition-all duration-200 ease-out",
                isOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-1 pointer-events-none",
              )}
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${group.key}-${item.to}`}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setOpenKey(null)}
                    className="group/item flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gold/5 transition-colors"
                  >
                    {Icon && (
                      <span className="mt-0.5 shrink-0 w-7 h-7 rounded-md bg-gold/10 text-gold flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" aria-hidden />
                      </span>
                    )}
                    <span className="flex flex-col min-w-0">
                      <span className="text-[12px] uppercase tracking-[0.18em] text-foreground group-hover/item:text-gold transition-colors">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-foreground/80 mt-0.5 normal-case tracking-normal">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

interface MobileNavProps {
  onNavigate?: () => void;
}

export const MobileNav = ({ onNavigate }: MobileNavProps) => {
  const { pathname } = useLocation();
  const { data: activeEvents } = useActiveEvents();
  const groupId = useId();

  return (
    <nav className="flex flex-col" aria-label="Mobile Navigation">
      {NAV_GROUPS.map((group) => {
        const active = isGroupActive(group, pathname);
        const items = group.items ?? [];

        if (!items.length) {
          return (
            <NavLink
              key={group.key}
              to={group.to ?? "#"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-5 py-4 min-h-[56px] border-b border-white/[0.07] transition-colors",
                  isActive
                    ? "text-gold bg-gold/[0.04]"
                    : "text-foreground/75 hover:text-foreground hover:bg-white/[0.03]",
                )
              }
            >
              <span className="text-[13px] font-medium tracking-[0.12em] uppercase">{group.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />}
            </NavLink>
          );
        }

        return (
          <details
            key={group.key}
            open={active}
            className="group/det border-b border-white/[0.07]"
          >
            <summary
              className={cn(
                "flex items-center justify-between cursor-pointer list-none px-5 py-4 min-h-[56px] transition-colors",
                active
                  ? "text-gold bg-gold/[0.04]"
                  : "text-foreground/75 hover:text-foreground hover:bg-white/[0.03]",
              )}
            >
              <span className="text-[13px] font-medium tracking-[0.12em] uppercase">{group.label}</span>
              <ChevronDown
                className="w-4 h-4 text-foreground/35 transition-transform duration-200 group-open/det:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="bg-black/85 px-3 pt-1.5 pb-3 flex flex-col gap-0.5" id={`${groupId}-${group.key}`}>


              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={`${group.key}-${item.to}`}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl min-h-[52px] transition-colors",
                        isActive
                          ? "text-gold bg-gold/[0.07]"
                          : "text-foreground/60 hover:text-foreground hover:bg-white/[0.04]",
                      )
                    }
                  >
                    {Icon && (
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-foreground/[0.07] border border-foreground/[0.1] flex items-center justify-center">
                        <Icon className="w-4 h-4" aria-hidden />
                      </span>
                    )}
                    <span className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium leading-snug">{item.label}</span>
                      {item.description && (
                        <span className="text-[11px] text-foreground/40 normal-case tracking-normal leading-tight mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </details>
        );
      })}
    </nav>
  );
};
