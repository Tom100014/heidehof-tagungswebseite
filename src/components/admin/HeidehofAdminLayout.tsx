import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ReactNode, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
// Admin-only CSS — loaded only when the admin layout mounts (never on public pages)
import "@/styles/admin-mobile.css";
import {
    BarChart3, BookOpen, DoorOpen, Home, Inbox,
    LogOut, Settings, UtensilsCrossed, Sparkles, Armchair,
    Building2, FileText, Activity, Star, ChevronDown, ChevronLeft, ChevronRight,
    Sun, Moon, Search, Command, X, ArrowRight, Zap, Image,
    HelpCircle, History, Megaphone, Users, Send, Mail, Clock, Gauge,
    ClipboardList, MessageSquare, CalendarDays, Hotel, Waves, BarChart, Layers, Plug,
} from "lucide-react";
import AdminNotificationBell from "./AdminNotificationBell";
import AdminErrorBoundary from "./AdminErrorBoundary";
import AdminAIHelp from "./AdminAIHelp";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { adminSecurity, type AdminRole } from "@/utils/admin-security";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type NavItem = { to: string; label: string; icon: typeof Inbox; badge?: number; roles?: AdminRole[] };
type NavGroup = { id: string; label: string; description: string; items: NavItem[]; primary?: boolean };
type CommandItem = NavItem & { group: string };

const FULL_ROLES: AdminRole[] = ["admin", "director"];
const ALL_STAFF_ROLES: AdminRole[] = ["admin", "director", "service", "kitchen", "conference"];
const SERVICE_ROLES: AdminRole[] = ["admin", "director", "service"];
const KITCHEN_ROLES: AdminRole[] = ["admin", "director", "kitchen"];
const CONFERENCE_ROLES: AdminRole[] = ["admin", "director", "conference"];

/* ─────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────── */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboards",
    label: "Cockpit & Dashboards",
    description: "Kommandozentrale und Direktor-Cockpit.",
    primary: true,
    items: [
      { to: "/admin",           label: "Kommandozentrale", icon: Home,  roles: ALL_STAFF_ROLES },
      { to: "/admin/direktion", label: "Direktor-Cockpit", icon: Gauge, roles: FULL_ROLES },
    ],
  },
  {
    id: "live",
    label: "Live-Betrieb",
    description: "Heutiges Tagesgeschäft.",
    items: [
      { to: "/admin/front-desk",  label: "Front-Desk",      icon: Hotel,           roles: ["admin","director","service"] },
      { to: "/admin/service",     label: "Service-Station", icon: UtensilsCrossed, roles: SERVICE_ROLES },
      { to: "/admin/inbox",       label: "Posteingang",     icon: Inbox,           roles: ["admin","director","service","conference"] },
      { to: "/admin/fb-service",  label: "F&B Service",     icon: UtensilsCrossed, roles: SERVICE_ROLES },
      { to: "/admin/kitchen",     label: "Küche",           icon: Activity,        roles: KITCHEN_ROLES },
      { to: "/admin/beauty",      label: "Beauty & Spa",    icon: Sparkles,        roles: FULL_ROLES },
    ],
  },
  {
    id: "conference",
    label: "Tagungen & Räume",
    description: "Anfragen, Räume, Pakete, Technik.",
    items: [
      { to: "/admin/conference-orders", label: "Tagungen",       icon: ClipboardList, roles: CONFERENCE_ROLES },
      { to: "/admin/rooms",             label: "Zimmer & Räume", icon: DoorOpen,      roles: [...FULL_ROLES,"conference"] },
      { to: "/admin/setups",            label: "Raum-Setups",    icon: Armchair,      roles: [...FULL_ROLES,"conference"] },
      { to: "/admin/tagungspauschalen", label: "Tagungspakete",  icon: FileText,      roles: [...FULL_ROLES,"conference"] },
      { to: "/admin/tagungstechnik",    label: "Tagungstechnik", icon: Zap,           roles: [...FULL_ROLES,"conference"] },
    ],
  },
  {
    id: "sales",
    label: "Vertrieb",
    description: "Lead-Pipeline und Akquise.",
    items: [
      { to: "/admin/leads", label: "Leads", icon: Megaphone, roles: CONFERENCE_ROLES },
    ],
  },
  {
    id: "content",
    label: "Inhalte & Medien",
    description: "Karten, Wellness, Website, Bilder, Clara.",
    items: [
      { to: "/admin/speisen",             label: "Speisen",             icon: BookOpen,     roles: [...FULL_ROLES,"service","kitchen"] },
      { to: "/admin/getraenkekarte",      label: "Getränke",            icon: BookOpen,     roles: SERVICE_ROLES },
      { to: "/admin/wellness",            label: "Wellness & Spa",      icon: Waves,        roles: FULL_ROLES },
      { to: "/admin/veranstaltungen",     label: "Veranstaltungen",     icon: CalendarDays, roles: [...FULL_ROLES,"conference"] },
      { to: "/admin/medien",              label: "Medien",              icon: Image,        roles: FULL_ROLES },
      { to: "/admin/clara",               label: "Clara",               icon: Sparkles,     roles: FULL_ROLES },
      { to: "/admin/inhalte",             label: "Website-Inhalte",     icon: FileText,     roles: FULL_ROLES },
      { to: "/admin/seiten-sichtbarkeit", label: "Seiten-Sichtbarkeit", icon: Home,         roles: FULL_ROLES },
      { to: "/admin/ein-tag",             label: "Cinema-Steps",        icon: Star,         roles: FULL_ROLES },
      { to: "/admin/partners",            label: "Partner",             icon: Building2,    roles: FULL_ROLES },
    ],
  },
  {
    id: "system",
    label: "System",
    description: "Auswertung, E-Mail, Integrationen, Einstellungen.",
    items: [
      { to: "/admin/auswertung",      label: "Auswertung",          icon: BarChart3, roles: FULL_ROLES },
      { to: "/admin/email-routing",   label: "E-Mail-Routing",      icon: Mail,      roles: FULL_ROLES },
      { to: "/admin/email-templates", label: "Transaktions-Mails",  icon: Mail,      roles: FULL_ROLES },
      { to: "/admin/integrations",    label: "Integrationen",       icon: Zap,       roles: FULL_ROLES },
      { to: "/admin/mews",            label: "Mews PMS",            icon: Plug,      roles: FULL_ROLES },
      { to: "/admin/aktivitaet",      label: "Aktivitätsprotokoll", icon: History,   roles: FULL_ROLES },
      { to: "/admin/einstellungen",   label: "Einstellungen",       icon: Settings,  roles: FULL_ROLES },
      { to: "/admin/hilfe",           label: "Hilfe",               icon: HelpCircle, roles: ALL_STAFF_ROLES },
    ],
  },
];

/* ─────────────────────────────────────────────
   COMMAND-PALETTE
───────────────────────────────────────────── */
const canUseItem = (item: NavItem, roles: AdminRole[]) =>
  !item.roles || item.roles.some((role) => roles.includes(role));

const filterNavGroups = (groups: NavGroup[], roles: AdminRole[]) =>
  groups
    .map((group) => ({ ...group, items: group.items.filter((item) => canUseItem(item, roles)) }))
    .filter((group) => group.items.length > 0);

function CommandPalette({ commands, onClose }: { commands: CommandItem[]; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim()
      ? commands.filter(
                (c) =>
                            c.label.toLowerCase().includes(query.toLowerCase()) ||
                            c.group.toLowerCase().includes(query.toLowerCase())
              )
        : commands;

  useEffect(() => {
        inputRef.current?.focus();
  }, []);

  useEffect(() => {
        setSelected(0);
  }, [query]);

  const handleKey = useCallback(
        (e: React.KeyboardEvent) => {
                if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSelected((s) => Math.min(s + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelected((s) => Math.max(s - 1, 0));
                } else if (e.key === "Enter" && results[selected]) {
                          navigate(results[selected].to);
                          onClose();
                } else if (e.key === "Escape") {
                          onClose();
                }
        },
        [results, selected, navigate, onClose]
      );

  return (
        <div
                role="dialog"
                aria-modal="true"
                aria-label="Command Palette"
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
                onClick={onClose}
              >
          {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
          {/* Panel */}
              <div
                        className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                                    animation: "cmdPaletteIn 0.18s cubic-bezier(.22,1,.36,1) both",
                        }}
                      >
                {/* Input row */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <input
                                              ref={inputRef}
                                              type="text"
                                              placeholder="Suchen oder navigieren…"
                                              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                              value={query}
                                              onChange={(e) => setQuery(e.target.value)}
                                              onKeyDown={handleKey}
                                              aria-label="Suche"
                                            />
                                <button
                                              onClick={onClose}
                                              className="p-1 rounded hover:bg-muted transition-colors"
                                              aria-label="Schließen"
                                            >
                                            <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                      </div>
              
                {/* Results */}
                      <div className="max-h-80 overflow-y-auto py-2" role="listbox">
                        {results.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                                  Keine Ergebnisse für „{query}"
                                    </p>
                                  ) : (
                                    results.map((cmd, i) => {
                                                    const Icon = cmd.icon;
                                                    const isSelected = i === selected;
                                                    return (
                                                                      <button
                                                                                          key={cmd.to}
                                                                                          role="option"
                                                                                          aria-selected={isSelected}
                                                                                          onClick={() => { navigate(cmd.to); onClose(); }}
                                                                                          onMouseEnter={() => setSelected(i)}
                                                                                          className={cn(
                                                                                                                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                                                                                                                isSelected
                                                                                                                  ? "bg-[hsl(var(--apple)/0.15)] text-foreground"
                                                                                                                  : "text-muted-foreground hover:bg-muted"
                                                                                                              )}
                                                                                        >
                                                                                         <div className={cn(
                                                                                                              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                                                                              isSelected ? "bg-[hsl(var(--apple))] text-primary-foreground" : "bg-muted"
                                                                                                            )}>
                                                                                                            <Icon className="w-3.5 h-3.5" />
                                                                                          </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                                            <p className="font-medium truncate">{cmd.label}</p>
                                                                                                            <p className="text-xs text-muted-foreground">{cmd.group}</p>
                                                                                          </div>
                                                                        {isSelected && (
                                                                                                              <kbd className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                                                                                                                                    ↵
                                                                                                                </kbd>
                                                                                        )}
                                                                      </button>
                                                                    );
                                    })
                                  )}
                      </div>
              
                {/* Footer hints */}
                      <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <kbd className="bg-background border border-border rounded px-1.5 py-0.5">↑↓</kbd>
                                            Navigation
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <kbd className="bg-background border border-border rounded px-1.5 py-0.5">↵</kbd>
                                            Öffnen
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <kbd className="bg-background border border-border rounded px-1.5 py-0.5">Esc</kbd>
                                            Schließen
                                </span>
                      </div>
              </div>
        
              <style>{`
                      @keyframes cmdPaletteIn {
                                from { opacity: 0; transform: scale(0.96) translateY(-8px); }
                                          to   { opacity: 1; transform: scale(1) translateY(0); }
                                                  }
                                                        `}</style>
        </div>
      );
}

/* ─────────────────────────────────────────────
   SIDEBAR NAV INNER
   ───────────────────────────────────────────── */
function SidebarNav({
    collapsed,
    navGroups,
    onNavigate,
}: {
    collapsed: boolean;
    navGroups: NavGroup[];
    onNavigate?: () => void;
}) {
    const { pathname } = useLocation();
    const groupIsActive = useCallback(
      (group: NavGroup) =>
        group.items.some((item) => item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to)),
      [pathname],
    );
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
      if (typeof window === "undefined") {
        return Object.fromEntries(navGroups.map((group) => [group.id, Boolean(group.primary)]));
      }
      const stored = window.localStorage.getItem("heidehof-admin-nav-folders");
      if (stored) {
        try {
          return JSON.parse(stored) as Record<string, boolean>;
        } catch {
          // fall through to defaults
        }
      }
      return Object.fromEntries(navGroups.map((group) => [group.id, Boolean(group.primary)]));
    });

    useEffect(() => {
      const active = navGroups.find(groupIsActive);
      if (!active) return;
      setOpenGroups((prev) => ({ ...prev, [active.id]: true }));
    }, [groupIsActive, pathname, navGroups]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem("heidehof-admin-nav-folders", JSON.stringify(openGroups));
    }, [openGroups]);

    const toggleGroup = (id: string) => {
      setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };
  
    return (
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-2 scrollbar-thin" aria-label="Hauptnavigation">
            {navGroups.map((group) => (
                    <div key={group.id} className={cn("px-2", !collapsed && group.primary && "mb-2")}>
                      {!collapsed && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors",
                            "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]",
                            groupIsActive(group) ? "text-foreground" : "text-muted-foreground",
                          )}
                          aria-expanded={openGroups[group.id] ?? false}
                          aria-controls={`admin-nav-folder-${group.id}`}
                        >
                          <span className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            group.primary || groupIsActive(group) ? "bg-[hsl(var(--apple))]" : "bg-muted-foreground/40",
                          )} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] uppercase tracking-[0.24em] font-semibold truncate">
                              {group.label}
                            </span>
                            <span className="block text-[10px] normal-case tracking-normal opacity-65 truncate">
                              {group.description}
                            </span>
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform",
                              openGroups[group.id] && "rotate-180",
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    
                              <div className={cn(
                                  !collapsed && !(openGroups[group.id] ?? false) && "hidden",
                                  group.primary && !collapsed
                                    ? "bg-[hsl(var(--apple)/0.06)] border border-[hsl(var(--apple)/0.18)] rounded-xl p-1 space-y-0.5"
                                    : "space-y-0.5"
                                )}
                                id={`admin-nav-folder-${group.id}`}
                              >
                                {group.items.map(({ to, label, icon: Icon, badge }) => {
                                    const isActive = to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
                                    return (
                                                      <NavLink
                                                                          key={to}
                                                                          to={to}
                                                                          end={to === "/admin"}
                                                                          onClick={onNavigate}
                                                                          aria-label={label}
                                                                          aria-current={isActive ? "page" : undefined}
                                                                          title={collapsed ? label : undefined}
                                                                          className={cn(
                                                                                                "relative flex items-center rounded-lg transition-all duration-150 group",
                                                                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))] focus-visible:ring-offset-1",
                                                                                                collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2",
                                                                                                isActive
                                                                                                  ? "bg-[hsl(var(--apple)/0.15)] text-[hsl(var(--apple-deep))]"
                                                                                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                                              )}
                                                                        >
                                                        {/* Active indicator bar */}
                                                        {isActive && !collapsed && (
                                                                                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[hsl(var(--apple))]" />
                                                                                            )}
                                                      
                                                                        <Icon
                                                                                              className={cn(
                                                                                                                      "flex-shrink-0 transition-colors",
                                                                                                                      collapsed ? "w-5 h-5" : "w-4 h-4",
                                                                                                                      isActive ? "text-[hsl(var(--apple))]" : "text-muted-foreground group-hover:text-foreground"
                                                                                                                    )}
                                                                                              aria-hidden="true"
                                                                                            />
                                                      
                                                        {!collapsed && (
                                                                                              <>
                                                                                                                    <span className="flex-1 text-sm font-medium truncate">{label}</span>
                                                                                                {badge != null && badge > 0 && (
                                                                                                                         <span className="min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--apple))] text-primary-foreground text-xs font-bold flex items-center justify-center px-1">
                                                                                                                           {badge > 99 ? "99+" : badge}
                                                                                                                           </span>
                                                                                                                    )}
                                                                                                </>
                                                                                            )}
                                                      
                                                        {/* Collapsed tooltip */}
                                                        {collapsed && (
                                                                                              <span
                                                                                                                      className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-foreground text-xs rounded-lg shadow-lg
                                                                                                                                 opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity"
                                                                                                                      role="tooltip"
                                                                                                                    >
                                                                                                {label}
                                                                                                </span>
                                                                        )}
                                                      </NavLink>
                                                    );
                    })}
                              </div>
                    </div>
                  ))}
          </nav>
        );
}

/* ─────────────────────────────────────────────
   THEME TOGGLE
   ───────────────────────────────────────────── */
function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const dark = theme === "dark";
    const toggle = () => setTheme(dark ? "light" : "dark");

    return (
        <button
            onClick={toggle}
            aria-label={dark ? "Light Mode aktivieren" : "Dark Mode aktivieren"}
            title={dark ? "Light Mode" : "Dark Mode"}
            className={cn(
                "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
            )}
        >
            {dark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
    );
}

/* ─────────────────────────────────────────────
   SKELETON LOADER
   ───────────────────────────────────────────── */
export function AdminSkeletonCard({ className }: { className?: string }) {
    return (
          <div className={cn("rounded-2xl bg-muted overflow-hidden animate-pulse", className)}>
                <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
          </div>
        );
}

/* ─────────────────────────────────────────────
   MAIN LAYOUT
   ───────────────────────────────────────────── */
interface HeidehofAdminLayoutProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
}

export default function HeidehofAdminLayout({
    children,
    title,
    actions,
}: HeidehofAdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [cmdOpen, setCmdOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [roles, setRoles] = useState<AdminRole[]>(FULL_ROLES);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const navGroups = useMemo(() => filterNavGroups(NAV_GROUPS, roles), [roles]);
    const allCommands = useMemo(
      () => navGroups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label }))),
      [navGroups],
    );
    const currentCommand = useMemo(() => {
      const exact = allCommands.find((cmd) => cmd.to === pathname);
      if (exact) return exact;
      return allCommands
        .filter((cmd) => cmd.to !== "/admin" && pathname.startsWith(cmd.to))
        .sort((a, b) => b.to.length - a.to.length)[0];
    }, [pathname, allCommands]);

    useEffect(() => {
      let mounted = true;
      adminSecurity.getRoles().then((nextRoles) => {
        if (mounted && nextRoles.length > 0) setRoles(nextRoles);
      });
      return () => { mounted = false; };
    }, []);
  
    /* ── Cmd+K shortcut ── */
    useEffect(() => {
          const handler = (e: KeyboardEvent) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                            e.preventDefault();
                            setCmdOpen((v) => !v);
                  }
          };
          window.addEventListener("keydown", handler);
          return () => window.removeEventListener("keydown", handler);
    }, []);
  
    const handleSignOut = async () => {
          await supabase.auth.signOut();
          navigate("/admin/login");
    };
  
    const sidebarWidth = collapsed ? "w-[60px]" : "w-[280px]";
  
    return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden admin-shell">
          
            {/* ── DESKTOP SIDEBAR ── */}
                <aside
                          className={cn(
                                      "hidden md:flex flex-col h-full border-r border-border bg-card flex-shrink-0 transition-all duration-300 ease-in-out",
                                      sidebarWidth
                                    )}
                          aria-label="Sidebar"
                        >
                  {/* Logo */}
                        <div className={cn(
                                    "flex items-center border-b border-border flex-shrink-0 h-14",
                                    collapsed ? "justify-center px-2" : "justify-between px-4"
                                  )}>
                          {!collapsed && (
                                      <Link
                                                      to="/"
                                                      className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))] rounded-lg"
                                                      aria-label="Heidehof Home"
                                                    >
                                                    <div className="w-8 h-8 rounded-lg bg-apple-gradient flex items-center justify-center shadow-apple flex-shrink-0">
                                                                    <Sparkles className="w-3.5 h-3.5 text-primary-foreground" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                                    <p className="text-xs font-bold text-foreground leading-tight">Heidehof</p>
                                                                    <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--apple))]">Admin Studio</p>
                                                    </div>
                                      </Link>
                                  )}
                          {collapsed && (
                                      <div className="w-8 h-8 rounded-lg bg-apple-gradient flex items-center justify-center shadow-apple">
                                                    <Sparkles className="w-3.5 h-3.5 text-primary-foreground" aria-hidden="true" />
                                      </div>
                                  )}
                          {!collapsed && (
                                      <button
                                                      onClick={() => setCollapsed(true)}
                                                      aria-label="Sidebar einklappen"
                                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                    >
                                                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                                      </button>
                                  )}
                        </div>
                
                  {/* Search / Cmd+K trigger */}
                  {!collapsed ? (
                                    <button
                                                  onClick={() => setCmdOpen(true)}
                                                  aria-label="Suche öffnen (Cmd+K)"
                                                  className={cn(
                                                                  "mx-3 my-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50",
                                                                  "text-xs text-muted-foreground hover:bg-muted transition-colors",
                                                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                                )}
                                                >
                                                <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                                                <span className="flex-1 text-left">Suchen…</span>
                                                <span className="flex items-center gap-0.5 opacity-60 text-base">
                                                              <kbd className="text-xs bg-background border border-border rounded px-1">⌘</kbd>
                                                              <kbd className="text-xs bg-background border border-border rounded px-1">K</kbd>
                                                </span>
                                    </button>
                                  ) : (
                                    <button
                                                  onClick={() => setCmdOpen(true)}
                                                  aria-label="Suche öffnen"
                                                  className="w-10 h-10 mx-auto my-2 flex items-center justify-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                >
                                                <Search className="w-4 h-4 text-muted-foreground" />
                                    </button>
                        )}
                
                  {/* Nav */}
                        <SidebarNav collapsed={collapsed} navGroups={navGroups} />
                
                  {/* Bottom actions */}
                        <div className={cn(
                                    "flex-shrink-0 border-t border-border py-3",
                                    collapsed ? "flex flex-col items-center gap-1 px-2" : "px-3 space-y-1"
                                  )}>
                          {collapsed && (
                                      <button
                                                      onClick={() => setCollapsed(false)}
                                                      aria-label="Sidebar aufklappen"
                                                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                    >
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                      </button>
                                  )}
                                   <ThemeToggle />
                                   <Link
                                     to="/admin/hilfe"
                                     aria-label="Hilfe & Einarbeitung"
                                     title="Hilfe & Einarbeitung"
                                     className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                   >
                                     <HelpCircle className="w-4 h-4" />
                                   </Link>
                                   <AdminNotificationBell />
                                  <button
                                                onClick={handleSignOut}
                                                aria-label="Abmelden"
                                                title={collapsed ? "Abmelden" : undefined}
                                                className={cn(
                                                                "flex items-center rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive",
                                                                collapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2 w-full"
                                                              )}
                                              >
                                              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                                    {!collapsed && <span className="text-sm font-medium">Abmelden</span>}
                                  </button>
                        </div>
                </aside>
          
            {/* ── MOBILE OVERLAY SIDEBAR ── */}
            {mobileOpen && (
                    <div
                                className="fixed inset-0 z-40 md:hidden"
                                onClick={() => setMobileOpen(false)}
                                aria-hidden="true"
                              >
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    </div>
                )}
                <aside
                          id="mobile-sidebar"
                          className={cn(
                                      "fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border flex flex-col md:hidden",
                                      "transition-transform duration-300 ease-in-out",
                                      mobileOpen ? "translate-x-0" : "-translate-x-full"
                                    )}
                          aria-label="Mobile Navigation"
                        >
                        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
                                  <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-lg bg-apple-gradient flex items-center justify-center shadow-apple">
                                                            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                                              </div>
                                              <p className="text-sm font-bold text-foreground">Heidehof Admin</p>
                                  </Link>
                                  <button
                                                onClick={() => setMobileOpen(false)}
                                                aria-label="Navigation schließen"
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                              >
                                              <X className="w-5 h-5 text-muted-foreground" />
                                  </button>
                        </div>
                        <SidebarNav collapsed={false} navGroups={navGroups} onNavigate={() => setMobileOpen(false)} />
                        <div className="px-3 pb-4 border-t border-border pt-3 space-y-1">
                                  <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                              >
                                              <LogOut className="w-4 h-4" />
                                              Abmelden
                                  </button>
                        </div>
                </aside>
          
            {/* ── MAIN CONTENT ── */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                
                  {/* ── TOP BAR ── */}
                        <header
                                    className="h-14 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-30"
                                    role="banner"
                                  >
                          {/* Left: Mobile hamburger + page title */}
                                  <div className="flex items-center gap-3">
                                    {/* Mobile toggle */}
                                              <button
                                                              onClick={() => setMobileOpen(true)}
                                                              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                              aria-label="Navigation öffnen"
                                                              aria-expanded={mobileOpen}
                                                              aria-controls="mobile-sidebar"
                                                            >
                                                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                            </svg>
                                              </button>
                                  
                                    <div className="min-w-0">
                                      {currentCommand && (
                                        <p className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">
                                          {currentCommand.group}
                                        </p>
                                      )}
                                      {title && (
                                        <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                                          {title}
                                        </h1>
                                      )}
                                    </div>
                                  </div>
                        
                          {/* Right: Actions + Search + Notifications (F-Pattern: key actions top right) */}
                                  <div className="flex items-center gap-2">
                                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                                    <Link
                                      to="/admin"
                                      className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                      <Activity className="h-3.5 w-3.5 text-[hsl(var(--apple))]" />
                                      Live-Cockpit
                                    </Link>
                                  
                                    {/* Cmd+K search pill */}
                                              <button
                                                              onClick={() => setCmdOpen(true)}
                                                              aria-label="Schnellsuche (Cmd+K)"
                                                              className={cn(
                                                                                "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50",
                                                                                "text-xs text-muted-foreground hover:bg-muted transition-colors",
                                                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]"
                                                                              )}
                                                            >
                                                            <Search className="w-3.5 h-3.5" aria-hidden="true" />
                                                            <span>Suchen</span>
                                                            <span className="flex items-center gap-0.5 opacity-70">
                                                                            <kbd className="text-xs bg-background border border-border rounded px-1">⌘K</kbd>
                                                            </span>
                                              </button>
                                  
                                              <ThemeToggle />
                                              <AdminNotificationBell />
                                  </div>
                        </header>
                
                  {/* ── PAGE CONTENT (fixed-height dashboard grid, no page scroll) ── */}
                        <main
                                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-5"
                                    id="main-content"
                                    role="main"
                                    tabIndex={-1}
                                  >
          <div className="h-full min-h-0">
                            <AdminErrorBoundary>{children}</AdminErrorBoundary>
                          </div>
                        </main>
                </div>
          
            {/* ── COMMAND PALETTE ── */}
            {cmdOpen && <CommandPalette commands={allCommands} onClose={() => setCmdOpen(false)} />}

            {/* ── GLOBAL AI HELP ── */}
            <AdminAIHelp pageTitle={title} />
          </div>
        );
}
