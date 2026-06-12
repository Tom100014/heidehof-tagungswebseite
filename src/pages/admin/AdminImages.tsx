import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Upload, RefreshCw, Image as ImageIcon, Sparkles, Loader2, Wand2, Search,
  ExternalLink, FolderOpen, Home, Tag, DoorOpen, Monitor, TreePine,
  MessageSquare, UtensilsCrossed, Wine, Waves, Star, Layout, Globe,
  CheckCircle2, Video, ChevronRight, ChevronDown, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { refreshSiteImages } from "@/hooks/useSiteImages";
import SiteImageGalleryPicker, { type GalleryItem } from "@/components/admin/SiteImageGalleryPicker";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";
import { type ReferenceScope } from "@/services/images/reference-library";

/** Per-page color + icon config for visual section differentiation */
const PAGE_CONFIG: Record<string, {
  icon: React.ElementType;
  ring: string;
  badge: string;
  dot: string;
  header: string;
  navBg: string;
  navText: string;
  path: string;
}> = {
  "Landingpage":          { icon: Home,           ring: "border-blue-500/40",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",   dot: "bg-blue-400",    header: "border-l-blue-500",    navBg: "bg-blue-500/10 border-blue-500/30",   navText: "text-blue-300",    path: "/" },
  "Tagungspauschalen":    { icon: Tag,            ring: "border-amber-500/40",  badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",  dot: "bg-amber-400",   header: "border-l-amber-500",   navBg: "bg-amber-500/10 border-amber-500/30",  navText: "text-amber-300",   path: "/tagungspauschalen" },
  "Tagungsräume":         { icon: DoorOpen,       ring: "border-indigo-500/40", badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400", header: "border-l-indigo-500",  navBg: "bg-indigo-500/10 border-indigo-500/30", navText: "text-indigo-300",  path: "/tagungsraeume" },
  "Ausstattung & Technik":{ icon: Monitor,        ring: "border-cyan-500/40",   badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",     dot: "bg-cyan-400",    header: "border-l-cyan-500",    navBg: "bg-cyan-500/10 border-cyan-500/30",    navText: "text-cyan-300",    path: "/ausstattung-technik" },
  "Outdoor & Aktiv":      { icon: TreePine,       ring: "border-zinc-500/40",  badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",  dot: "bg-zinc-400",   header: "border-l-zinc-500",   navBg: "bg-zinc-500/10 border-zinc-500/30",  navText: "text-zinc-300",   path: "/outdoor-aktiv" },
  "Anfrage":              { icon: MessageSquare,  ring: "border-violet-500/40", badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",dot: "bg-violet-400",  header: "border-l-violet-500",  navBg: "bg-violet-500/10 border-violet-500/30", navText: "text-violet-300",  path: "/tagungsraeume" },
  "Speisekarte":          { icon: UtensilsCrossed,ring: "border-orange-500/40", badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",dot: "bg-orange-400",  header: "border-l-orange-500",  navBg: "bg-orange-500/10 border-orange-500/30", navText: "text-orange-300",  path: "/speisekarte" },
  "Getränkekarte":        { icon: Wine,           ring: "border-rose-500/40",   badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",     dot: "bg-rose-400",    header: "border-l-rose-500",    navBg: "bg-rose-500/10 border-rose-500/30",    navText: "text-rose-300",    path: "/getraenkekarte" },
  "Wellness":             { icon: Waves,          ring: "border-zinc-500/40",   badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",     dot: "bg-zinc-400",    header: "border-l-zinc-500",    navBg: "bg-zinc-500/10 border-zinc-500/30",    navText: "text-zinc-300",    path: "/wellness" },
  "Spa":                  { icon: Star,           ring: "border-pink-500/40",   badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",     dot: "bg-pink-400",    header: "border-l-pink-500",    navBg: "bg-pink-500/10 border-pink-500/30",    navText: "text-pink-300",    path: "/spa" },
  "Unterseiten":          { icon: Globe,          ring: "border-zinc-500/40",   badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",     dot: "bg-zinc-400",    header: "border-l-zinc-500",    navBg: "bg-zinc-500/10 border-zinc-500/30",    navText: "text-zinc-300",    path: "/" },
  "Footer":               { icon: Layout,         ring: "border-slate-500/40",  badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",  dot: "bg-slate-400",   header: "border-l-slate-500",   navBg: "bg-slate-500/10 border-slate-500/30",  navText: "text-slate-300",   path: "/" },
};

function getPageFromGroup(group: string): string {
  return group.split(" · ")[0] ?? group;
}

function getSubFromGroup(group: string): string {
  return group.split(" · ").slice(1).join(" · ") || group;
}

function pageConfig(group: string) {
  const page = getPageFromGroup(group);
  return PAGE_CONFIG[page] ?? { icon: ImageIcon, ring: "border-border/60", badge: "bg-muted/40 text-muted-foreground border-border/30", dot: "bg-muted-foreground", header: "border-l-border", navBg: "bg-muted/30 border-border/30", navText: "text-muted-foreground", path: "/" };
}

/** Map an image slot to the public route where it appears, so admins can preview in context. */
function previewPathForSlot(slot: { slug: string; group: string }): { label: string; path: string } | null {
  const g = slot.group;
  if (g.startsWith("Landingpage")) return { label: "Landingpage", path: "/" };
  if (g.startsWith("Tagungspauschalen")) return { label: "Tagungspauschalen", path: "/tagungspauschalen" };
  if (g.startsWith("Tagungsräume")) return { label: "Tagungsräume", path: "/tagungsraeume" };
  if (g.startsWith("Ausstattung")) return { label: "Ausstattung & Technik", path: "/ausstattung-technik" };
  if (g.startsWith("Outdoor")) return { label: "Outdoor & Aktiv", path: "/outdoor-aktiv" };
  if (g.startsWith("Wellness")) return { label: "Wellness", path: "/wellness" };
  if (g.startsWith("Spa")) return { label: "Spa", path: "/spa" };
  if (g.startsWith("Anfrage")) return { label: "Anfrage", path: "/tagungsraeume" };
  if (g.startsWith("Speisekarte") || g.startsWith("Tagesmenü")) return { label: "Speisekarte", path: "/speisekarte" };
  if (g.startsWith("Getränkekarte")) return { label: "Getränkekarte", path: "/getraenkekarte" };
  if (g.startsWith("Footer") || g.startsWith("Allgemein")) return { label: "Alle Seiten (Footer)", path: "/" };
  if (g.startsWith("Unterseiten")) return { label: "Alle Unterseiten (Fallback)", path: "/tagungsraeume" };
  return null;
}

/**
 * Catalog of every image slot used on the public site.
 * Keep in sync with <SiteImage slug="..." /> usages.
 */
const SLOTS: { slug: string; label: string; fallback: string; group: string; suggestion: string; allowVideo?: boolean; defaultBrightness?: number }[] = [
  // ═══════════════════════════════════════════════════════════════
  // LANDINGPAGE (Startseite "/")
  // ═══════════════════════════════════════════════════════════════

  // 1. Hero & Was-wir-leisten
  { slug: "hero-conference", label: "Top-Hero – Tagungsräume (Bild/Video)", fallback: "/heidehof/orig/hero-conference.jpg", group: "Landingpage · 1. Hero-Bereich", allowVideo: true, defaultBrightness: 1.28,
    suggestion: "Cinematischer Blick in einen lichtdurchfluteten Tagungsraum des Heidehof, Tageslicht durch große Fenster, edle Holzdetails, leere Bestuhlung, weicher Bokeh-Hintergrund." },
  { slug: "leistungen-hero", label: "Was wir leisten – Hintergrund (Bild/Video)", fallback: "/heidehof/orig/hero-conference.jpg", group: "Landingpage · 1. Hero-Bereich", allowVideo: true, defaultBrightness: 1.2,
    suggestion: "Cinematisches Hintergrund-Video oder -Bild: Schwenk durch Tagungsraum, Restaurant, SPA. Warmes Licht, slow motion, edel." },

  // 1b. Aktuelles-Sektion (6 Karten zwischen Hero und Tagungsräume-Übersicht)
  { slug: "landing-akt-alles-drin", label: "Aktuelles 01 – Alles drin (Pauschalen)", fallback: "/heidehof/orig/zimmer-1.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Edles Hotelzimmer, weiche Textilien, Morgenlicht – steht für All-Inclusive-Pauschale." },
  { slug: "landing-akt-tagen", label: "Aktuelles 02 – Tagen (8 Räume)", fallback: "/heidehof/orig/hero-conference.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Großer Tagungsraum mit Tageslicht, edle Bestuhlung, Hybrid-Technik im Hintergrund." },
  { slug: "landing-akt-geniessen", label: "Aktuelles 03 – Genießen (Kulinarik)", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Fine-Dining-Teller mit Sommelier-Wein, dunkles Holz, warmes Kerzenlicht." },
  { slug: "landing-akt-loslassen", label: "Aktuelles 04 – Loslassen (Spa)", fallback: "/heidehof/orig/spa-pool.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Pool mit Dampf, Kerzen, ruhige Spa-Atmosphäre auf 400 m²." },
  { slug: "landing-akt-durchatmen", label: "Aktuelles 05 – Durchatmen (Outdoor & Beauty)", fallback: "/heidehof/outdoor.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Sonnige Hotelterrasse mit Heideblick, Lounge-Möbel, Altmühltal im Hintergrund." },
  { slug: "landing-akt-ankommen", label: "Aktuelles 06 – Ankommen (115 Zimmer)", fallback: "/heidehof/orig/hotel-impression.jpg", group: "Landingpage · 1b. Aktuelles-Karten",
    suggestion: "Ruhiges Hotelzimmer, weiches Morgenlicht, edle Stoffe, Suite-Charakter." },



  // 2. Tagungsräume-Übersicht auf Landing (Karten pro Raum)

  // 3. Pauschalen-, Zimmer-, Kulinarik-Karten (großes Karussell)
  { slug: "outdoor", label: "Karte: Outdoor & Aktiv", fallback: "/heidehof/outdoor.jpg", group: "Landingpage · 3. Pauschalen & Hotel-Karten",
    suggestion: "Sonnige Outdoor-Terrasse mit Heideblick und Lounge-Möbeln im Altmühltal." },

  // 4. Lifestyle-Karten (kleines Karussell unten)
  { slug: "le-petit-chef", label: "Lifestyle: Le Petit Chef (Show-Dining)", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Landingpage · 4. Lifestyle-Karten",
    suggestion: "Le Petit Chef Show-Dining: gedeckter Tisch mit projiziertem Mini-Koch, faszinierte Gäste, dunkler Raum, magisches Licht." },

  // 5. Partner-Sektion (Marquee-Hintergrund)
  { slug: "partner-bg", label: "Partner-Sektion Hintergrund (Bild/Video)", fallback: "", group: "Landingpage · 5. Partner-Sektion", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Cinematischer, ruhiger Hintergrund (z.B. Hotel-Lobby, Heideland-Drohne, Audi-Werk im Detail) – wird mit dunkler Überlagerung versehen." },
  // 5b. Manifesto-Strip Hintergrund
  { slug: "landing-manifest-bg", label: "Manifest-Strip Hintergrund (Bild/Video)", fallback: "", group: "Landingpage · 5b. Manifest-Strip", allowVideo: true, defaultBrightness: 0.6,
    suggestion: "Ruhiges, edles Hintergrundbild (z.B. Detail-Stillleben, dunkle Textur, Hotel-Atmosphäre) – wird stark abgedunkelt für das Zitat." },

  // 6. Anfrage-CTA ganz unten („Bereit, Ihren Tag neu zu komponieren?")
  { slug: "landing-cta-anfrage-bg", label: "Anfrage-CTA Hintergrund (Bild/Video)", fallback: "", group: "Landingpage · 6. Anfrage-CTA", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Atmosphärischer Abschluss (z.B. Sonnenuntergang Heide, ruhiger Hotelflur, Detail-Stillleben) – wird dunkel überlagert für lesbare Headline." },



  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: TAGUNGSPAUSCHALEN  (/tagungspauschalen)
  // ═══════════════════════════════════════════════════════════════
  { slug: "hero-tagungspauschalen", label: "Hero – Tagungspauschalen (Bild/Video)", fallback: "/heidehof/orig/zimmer-1.jpg", group: "Tagungspauschalen · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematische Tagungssituation am Heidehof: gedeckter Pausentisch, Kaffee, Patisserie, Tagungsraum im Hintergrund." },
  { slug: "cta-clara-pauschalen-bg", label: "Clara-CTA Hintergrund (Bild/Video)", fallback: "", group: "Tagungspauschalen · Clara-CTA", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Tisch-Setup mit Kaffee/Kuchenpause oder Mittagsmenü – passend zur Pauschalen-Seite." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: TAGUNGSRÄUME  (/tagungsraeume)
  // (Räume selbst werden aus Landing-Slugs übernommen – siehe oben)
  // ═══════════════════════════════════════════════════════════════
  { slug: "hero-tagungsraeume", label: "Hero – Tagungsräume (Bild/Video)", fallback: "/heidehof/saal-heidehof.jpg", group: "Tagungsräume · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Großer Tagungssaal des Heidehof, Theater-Bestuhlung, Tageslicht, edle Holzdetails." },
  { slug: "cta-clara-tagungsraeume-bg", label: "Clara-CTA Hintergrund (Bild/Video)", fallback: "", group: "Tagungsräume · Clara-CTA", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Eleganter Saal mit Bestuhlung – passend zur Tagungsräume-Seite." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: AUSSTATTUNG & TECHNIK  (/ausstattung-technik)
  // ═══════════════════════════════════════════════════════════════
  { slug: "hero-ausstattung", label: "Hero – Ausstattung & Technik (Bild/Video)", fallback: "/heidehof/ausstattung.jpg", group: "Ausstattung & Technik · 1. Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Moderner Tagungsraum mit Hybrid-Technik, Clever-Touch TV, Beamer und Tageslicht." },
  { slug: "tech-clever-touch-tv", label: "Feature 01 – Clever-Touch TV", fallback: "/heidehof/ausstattung.jpg", group: "Ausstattung & Technik · 2. Technik-Features",
    suggestion: "Großes interaktives 75″ Touch-TV in Tagungsraum, eine Person präsentiert, helles Display, modernes Setting." },
  { slug: "tech-konferenz-audio", label: "Feature 02 – Konferenz-Audio", fallback: "/heidehof/ausstattung.jpg", group: "Ausstattung & Technik · 2. Technik-Features",
    suggestion: "Decken- und Tischmikrofone in Konferenzraum, Bose-Lautsprecher, hybride Meeting-Atmosphäre." },
  { slug: "tech-high-speed-wlan", label: "Feature 03 – High-Speed WLAN", fallback: "/heidehof/ausstattung.jpg", group: "Ausstattung & Technik · 2. Technik-Features",
    suggestion: "Tagungsraum mit Notebooks und Tablets, sichtbares schnelles Internet-Setup, helles Tageslicht." },
  { slug: "tech-flipchart-pinnwand", label: "Feature 04 – Pinnwand & Flipchart", fallback: "/heidehof/ausstattung.jpg", group: "Ausstattung & Technik · 2. Technik-Features",
    suggestion: "Premium-Flipchart und Pinnwand mit Moderationskoffer, beschriftete Karten, Workshop-Atmosphäre." },
  { slug: "cta-clara-ausstattung-bg", label: "Clara-CTA Hintergrund (Bild/Video)", fallback: "", group: "Ausstattung & Technik · 3. Clara-CTA", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Beamer, Touch-TV oder Hybrid-Konferenztechnik in Aktion – passend zur Ausstattung-Seite." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: OUTDOOR & AKTIV  (/outdoor-aktiv)
  // ═══════════════════════════════════════════════════════════════
  { slug: "hero-outdoor", label: "Hero – Outdoor & Aktiv (Bild/Video)", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Sonnige Outdoor-Terrasse mit Heideblick und Lounge-Möbeln im Altmühltal." },
  { slug: "outdoor-hochseil", label: "Hochseilgarten", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Aktiv-Programme",
    suggestion: "Hochseilgarten zwischen Bäumen, Kletterer mit Helm, Sicherheitsausrüstung, Sonne." },
  { slug: "outdoor-klettern", label: "Klettern", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Aktiv-Programme",
    suggestion: "Kletterwand im Freien, Person mit Seil, konzentrierte Action." },
  { slug: "outdoor-survival", label: "Survival-Workshop", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Aktiv-Programme",
    suggestion: "Survival-Workshop im Wald, Lagerfeuer, Werkzeuge, Teamarbeit." },
  { slug: "outdoor-team", label: "Teamevent", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Aktiv-Programme",
    suggestion: "Kollegen beim Floßbau am See, lachen, Sonnenlicht, Wasser." },
  { slug: "audi-forum", label: "Highlight: Audi Forum & museum mobile", fallback: "/heidehof/orig/hero-conference.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Audi Forum Ingolstadt Architektur, museum mobile Glasfassade, Audi-Fahrzeuge, hochwertige Lichtstimmung." },
  { slug: "ingolstadt-village", label: "Highlight: Ingolstadt Village (Outlet)", fallback: "/heidehof/orig/hotel-impression.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Ingolstadt Village Boulevard, Designer-Boutiquen, eleganter Shopping-Lifestyle, warmes Tageslicht." },
  { slug: "westpark-ingolstadt", label: "Highlight: Westpark Einkaufszentrum", fallback: "/heidehof/orig/hotel-impression.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Modernes Shopping-Center Innenraum, helle Galerie, Schaufenster, Besucher beim Bummeln." },
  { slug: "ingolstadt-altstadt", label: "Highlight: Altstadt Ingolstadt", fallback: "/heidehof/orig/hotel-impression.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Ingolstadt Altstadt mit Neuem Schloss, Liebfrauenmünster, historische Gassen, abendliches Licht." },
  { slug: "altmuehltal", label: "Highlight: Naturpark Altmühltal", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Naturpark Altmühltal Flusstal, Felsformationen, Radweg, sattes Grün, weite Landschaft." },
  { slug: "baggersee", label: "Highlight: Baggersee Ingolstadt", fallback: "/heidehof/outdoor.jpg", group: "Outdoor & Aktiv · Highlights Region",
    suggestion: "Klarer Badesee mit Liegewiese, Beachvolleyball, sommerliche Atmosphäre, türkises Wasser." },
  { slug: "cta-clara-outdoor-bg", label: "Clara-CTA Hintergrund (Bild/Video)", fallback: "", group: "Outdoor & Aktiv · Clara-CTA", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Hotel-Park, Terrasse oder Altmühltal-Drohne – passend zur Outdoor-Seite." },

  // ═══════════════════════════════════════════════════════════════
  // CLARA-ANFRAGE AUF TAGUNGSRÄUME  (/tagungsraeume)
  // ═══════════════════════════════════════════════════════════════
  { slug: "clara-avatar", label: "Clara Avatar (Portrait)", fallback: "", group: "Anfrage · Clara",
    suggestion: "Portraitfoto Clara, freundlich, professionell, weiches Licht, neutraler Hintergrund." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: VERANSTALTUNGEN  (/veranstaltungen)
  // ═══════════════════════════════════════════════════════════════
  { slug: "veranstaltungen-hero", label: "Hero – Veranstaltungen (Bild/Video)", fallback: "", group: "Veranstaltungen · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematisches Bild eines festlich gedeckten Veranstaltungssaals oder Außen-Event." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: SPEISEKARTE / TAGESMENÜ  (/speisekarte)
  // ═══════════════════════════════════════════════════════════════
  { slug: "menue-hero", label: "Hero – Tagesmenü (Bild/Video)", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Speisekarte · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematisches Fine-Dining Bild oder Video: gedeckter Restauranttisch im Heidehof, warmes Kerzenlicht, edle Gläser, Fokus auf Teller, weicher Bokeh." },
  { slug: "speisekarte-hero", label: "Hero – Speisekarte (Bild/Video)", fallback: "/heidehof/speisekarte-hero.jpg", group: "Speisekarte · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematisches Restaurant-Bild: Eine reich gedeckte Tafel mit feinen bayerischen Gerichten, ansprechend angerichtet, weiches Kerzenlicht." },
  { slug: "getraenkekarte-hero", label: "Hero – Getränkekarte (Bild/Video)", fallback: "/heidehof/getraenkekarte-hero.jpg", group: "Getränkekarte · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematisches Bar-Bild: Edles Weinglas mit rotem oder weißem Wein, im Hintergrund eine stimmungsvolle Bar mit weichem Bokeh." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: RESTAURANT  (/restaurant) — vier Outlets, jeweils eigene Bild-Sektion
  // ═══════════════════════════════════════════════════════════════
  { slug: "restaurant-hero", label: "Hero – Restaurant (Bild/Video)", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Restaurant · Hero", allowVideo: true, defaultBrightness: 1.18,
    suggestion: "Cinematische Restaurant-Eröffnung: festlich gedeckte Tafel, warmes Kerzenlicht, edle Gläser, Bokeh-Hintergrund." },
  { slug: "restaurant-maxwell", label: "Restaurant Maxwell – Bild-Sektion", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Restaurant · Outlets", defaultBrightness: 1.18,
    suggestion: "Restaurant Maxwell: gedeckte Tafel, internationales Frontcooking, warmes Kerzenlicht, mediterrane Note." },
  { slug: "restaurant-fine-dining", label: "Fine-Dining-Lounge – Bild-Sektion", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Restaurant · Outlets", defaultBrightness: 1.15,
    suggestion: "Fine-Dining-Lounge: intime Atmosphäre, dunkle Hölzer, Sommelier mit Wein, kunstvoll angerichteter Teller." },
  { slug: "restaurant-bar-maex", label: "Hotelbar Mäx – Bild-Sektion", fallback: "/heidehof/orig/restaurant-1.jpg", group: "Restaurant · Outlets", defaultBrightness: 1.12,
    suggestion: "Hotelbar Mäx: Kupfer-Theke, Cocktail im Vordergrund, Bartender im Halbschatten, warmes Bernstein-Licht." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: WELLNESS & WASSERWELTEN  (/wellness)
  // ═══════════════════════════════════════════════════════════════
  { slug: "hero-wellness", label: "Hero – Wellness & Wasserwelten", fallback: "/heidehof/spa-pool.jpg", group: "Wellness · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Cinematisches Wellness-Bild: Großer Indoor-Pool mit warmem Wasser, Dampf, Kerzenlicht am Beckenrand." },

  // ═══════════════════════════════════════════════════════════════
  // UNTERSEITE: ORIENTAL SPA & BEAUTY  (/spa)
  // ═══════════════════════════════════════════════════════════════
  { slug: "spa-hero", label: "Hero – Oriental Spa & Beauty", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Hero", allowVideo: true, defaultBrightness: 1.15,
    suggestion: "Wellness-Spa Behandlungsraum: Kerzen, Orchideen, Massageöl-Fläschchen, Liege mit Handtüchern." },
  { slug: "spa-oriental", label: "Spa Atmosphäre", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Bereiche",
    suggestion: "Dampfbad mit orientalischen Mosaikfliesen, warmes Licht, entspannte Atmosphäre." },
  { slug: "spa-klapp", label: "Klapp Cosmetics Behandlungen", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Partner",
    suggestion: "Premium-Produkte von Klapp Cosmetics auf Holztablett neben einer Lotusblüte." },
  { slug: "spa-stbarth", label: "Ligne St. Barth Treatments", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Partner",
    suggestion: "Exotische Öle und Tiegel von Ligne St. Barth im tropischen Licht." },

  // Spa · Behandlungen (Treatment-Karten auf /spa)
  { slug: "klapp-hyaluronic-women", label: "Klapp Hyaluronic Multi-Effect Treatment", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Behandlungen Damen",
    suggestion: "Nahaufnahme einer Frau bei Gesichtsbehandlung mit Hyaluron-Serum, Pipette über Wange, edles Spa-Licht." },
  { slug: "st-barth-freshness", label: "Ligne St. Barth Freshness", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Behandlungen Damen",
    suggestion: "Frisches Papaya-Mousse und Avocadoöl auf Holztablett, tropische Blätter, Spa-Ambiente." },
  { slug: "klapp-classic-women", label: "Klapp Classic Wellness-Behandlung", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Behandlungen Damen",
    suggestion: "Frau auf Spa-Liege bei klassischer Gesichtsbehandlung, weiche Tücher, Kerzenlicht." },
  { slug: "klapp-men-supreme", label: "Klapp Men Supreme Power", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Behandlungen Herren",
    suggestion: "Mann mittleren Alters bei intensiver Gesichtsbehandlung, klare maskuline Spa-Atmosphäre, dunkle Holztöne." },
  { slug: "st-barth-men-short", label: "Ligne St. Barth Men Short Break", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Behandlungen Herren",
    suggestion: "Mann erhält Nackenmassage, frische Gesichtspflege, modernes maskulines Spa-Setting." },
  { slug: "heidehof-ganzkoerper", label: "Heidehof Classic Ganzkörpermassage", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Massagen",
    suggestion: "Therapeutin gibt klassische Rückenmassage, warme Hände auf Schulter, gedimmtes Licht." },
  { slug: "st-barth-harmony", label: "Ligne St. Barth Harmony Massage", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Massagen",
    suggestion: "Ganzkörpermassage mit goldenem Kokosöl, exotische Blüten, tropisches Spa." },
  { slug: "hot-stone-relax", label: "Heidehof Hot Stone Massage", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Massagen",
    suggestion: "Heiße Lavasteine auf entspanntem Rücken, Aromaöl, warmes Kerzenlicht." },
  { slug: "premium-manikuere", label: "Premium Maniküre", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Hand & Fuß",
    suggestion: "Gepflegte Hände bei Maniküre, Nagellack-Fläschchen, helles modernes Beauty-Ambiente." },
  { slug: "premium-pedikuere", label: "Premium Pediküre", fallback: "/heidehof/spa-hero.jpg", group: "Spa · Hand & Fuß",
    suggestion: "Fußbad mit Blüten, Pflegeprodukte auf Holztablett, ruhige Spa-Atmosphäre." },

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK FÜR ALLE UNTERSEITEN
  // ═══════════════════════════════════════════════════════════════
  { slug: "cta-clara-subpage-bg", label: "Clara-CTA Standard-Fallback (alle Unterseiten)", fallback: "", group: "Unterseiten · Clara-CTA Fallback", allowVideo: true, defaultBrightness: 0.55,
    suggestion: "Edler, dezenter Hintergrund (Saal-Detail, Tisch-Setup, Heideland-Stimmung) – Standard für alle Unterseiten ohne eigene CTA-Variante." },

  // ═══════════════════════════════════════════════════════════════
  // FOOTER (alle Seiten)
  // ═══════════════════════════════════════════════════════════════
  { slug: "footer-bg", label: "Footer-Hintergrund (Bild/Video)", fallback: "", group: "Footer · Alle Seiten", allowVideo: true, defaultBrightness: 0.45,
    suggestion: "Stimmungsvoller, dunkler Hintergrund: Nachtaufnahme Hotel, Kerzenlicht im Restaurant, ruhige Drohnenaufnahme." },
];

type Row = { slug: string; url: string; alt: string | null; storage_path: string | null; brightness: number; media_type?: string | null };

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function readableUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.toLowerCase().includes("mime type")) {
    return "Dieses Format ist nicht erlaubt. Nutze JPG, PNG, WEBP, AVIF oder MP4/WebM/MOV.";
  }
  return message || "Upload fehlgeschlagen";
}

function readableDatabaseError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function clampSiteImageBrightness(value: number): number {
  return Math.min(1.8, Math.max(0.35, value));
}

function getFileExtension(file: File, isVideo: boolean): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/svg+xml") return "svg";
  if (file.type === "image/avif") return "avif";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return isVideo ? "mp4" : "jpg";
}

function getScopeForSlot(slot: { slug: string; group: string }): ReferenceScope {
  const g = slot.group.toLowerCase();
  const s = slot.slug.toLowerCase();
  if (g.includes("wellness") || g.includes("spa") || s.includes("spa") || s.includes("wellness") || s.includes("beauty")) {
    return "wellness";
  }
  if (g.includes("getränke") || s.includes("drink") || s.includes("bar")) {
    return "drinks";
  }
  if (g.includes("speise") || g.includes("menü") || s.includes("dining") || s.includes("chef") || s.includes("gericht") || s.includes("teller")) {
    return "food";
  }
  if (g.includes("tagung") || g.includes("konferenz") || s.includes("pauschale") || s.includes("raum") || s.includes("hybrid") || s.includes("ausstattung")) {
    return "conference_menu";
  }
  return "events";
}

export default function AdminImages() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState<Record<string, string>>({});
  const [promptDraft, setPromptDraft] = useState<Record<string, string>>({});
  const [brightnessDraft, setBrightnessDraft] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [pickerSlot, setPickerSlot] = useState<(typeof SLOTS)[number] | null>(null);
  const [scraping, setScraping] = useState(false);
  const [genTarget, setGenTarget] = useState<(typeof SLOTS)[number] | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Deep-link: /admin/images?slug=hero-conference → scroll to + highlight slot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("slug");
    if (!target) return;
    setSearch("");
    setHighlightSlug(target);
    const t = window.setTimeout(() => {
      const el = document.getElementById(`slot-${target}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    const clear = window.setTimeout(() => setHighlightSlug(null), 4500);
    return () => { window.clearTimeout(t); window.clearTimeout(clear); };
  }, []);

  const load = async () => {
    const { data } = await supabase.from("site_images").select("*");
    const m: Record<string, Row> = {};
    (data || []).forEach((r) => { m[r.slug] = r; });
    setRows(m);
    refreshSiteImages();
  };
  useEffect(() => { load(); }, []);

  const handleFile = async (slot: (typeof SLOTS)[number], file: File) => {
    const { slug } = slot;
    const isVideo = SUPPORTED_VIDEO_TYPES.has(file.type);
    const isImage = SUPPORTED_IMAGE_TYPES.has(file.type);
    if (!isImage && !isVideo) {
      return toast.error("Bitte JPG, PNG, WEBP, AVIF oder MP4/WebM/MOV hochladen");
    }
    const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) return toast.error(isVideo ? "Maximal 100 MB pro Video" : "Maximal 10 MB pro Bild");
    setBusy(slug);
    try {
      const ext = getFileExtension(file, isVideo);
      const path = `${slug}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);
      const existing = rows[slug];
      const alt = altDraft[slug] ?? existing?.alt ?? "";
      const brightness = brightnessDraft[slug] ?? existing?.brightness ?? slot.defaultBrightness ?? 1.1;
      const uploadedRow: Row = { slug, url: pub.publicUrl, alt, storage_path: path, brightness, media_type: isVideo ? "video" : "image" };
      const { error: upsertError } = await supabase.from("site_images").upsert(uploadedRow);
      if (upsertError) throw upsertError;
      if (existing?.storage_path) {
        await supabase.storage.from("site-images").remove([existing.storage_path]);
      }
      setRows((current) => ({ ...current, [slug]: uploadedRow }));
      toast.success(isVideo ? "Video hochgeladen" : "Bild aktualisiert");
      await load();
    } catch (e: unknown) {
      toast.error(readableUploadError(e));
    } finally { setBusy(null); }
  };

  const runGenerate = async (
    slot: (typeof SLOTS)[number],
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    setAiBusy(slot.slug);
    try {
      const { data, error } = await supabase.functions.invoke("generate-site-image", {
        body: {
          slug: slot.slug,
          prompt,
          alt: altDraft[slot.slug] ?? rows[slot.slug]?.alt ?? slot.label,
          reference_image_urls: refUrls,
          references,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Fehler");
      toast.success("Bild generiert");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generierung fehlgeschlagen");
    } finally {
      setAiBusy(null);
    }
  };

  const reset = async (slug: string) => {
    if (!(await confirmAction({ description: "Bild auf Standard zurücksetzen?", destructive: true, confirmLabel: "Bestätigen" }))) return;
    setBusy(slug);
    const existing = rows[slug];
    if (existing?.storage_path) {
      await supabase.storage.from("site-images").remove([existing.storage_path]);
    }
    await supabase.from("site_images").delete().eq("slug", slug);
    toast.success("Zurückgesetzt");
    setBusy(null);
    await load();
  };

  const saveAlt = async (slug: string) => {
    const r = rows[slug];
    if (!r) return toast.error("Erst ein Bild hochladen oder generieren");
    const alt = altDraft[slug] ?? r.alt ?? "";
    const { error } = await supabase.from("site_images").update({ alt }).eq("slug", slug);
    if (error) toast.error(error.message);
    else { toast.success("Alt-Text gespeichert"); load(); }
  };

  const handlePick = async (slot: (typeof SLOTS)[number], item: GalleryItem) => {
    setBusy(slot.slug);
    try {
      const existing = rows[slot.slug];
      const alt = altDraft[slot.slug] ?? existing?.alt ?? "";
      const brightness = clampSiteImageBrightness(
        brightnessDraft[slot.slug] ?? existing?.brightness ?? slot.defaultBrightness ?? 1.1,
      );
      const { error } = await supabase.from("site_images").upsert({
        slug: slot.slug,
        url: item.url,
        alt,
        storage_path: item.path,
        brightness,
        media_type: item.isVideo ? "video" : "image",
      });
      if (error) throw error;
      setRows((current) => ({
        ...current,
        [slot.slug]: {
          slug: slot.slug,
          url: item.url,
          alt,
          storage_path: item.path,
          brightness,
          media_type: item.isVideo ? "video" : "image",
        },
      }));
      toast.success("Aus Galerie übernommen");
      setPickerSlot(null);
      await load();
    } catch (e: unknown) {
      toast.error(readableDatabaseError(e, "Übernahme fehlgeschlagen"));
    } finally {
      setBusy(null);
    }
  };

  const saveBrightness = async (slot: (typeof SLOTS)[number]) => {
    const existing = rows[slot.slug];
    if (!existing) {
      toast.error("Bitte zuerst ein Bild hochladen, dann Helligkeit speichern.");
      return;
    }
    const brightness = brightnessDraft[slot.slug] ?? existing.brightness ?? slot.defaultBrightness ?? 1.1;
    const { error } = await supabase.from("site_images").update({ brightness }).eq("slug", slot.slug);
    if (error) return toast.error(error.message);
    toast.success("Helligkeit gespeichert");
    await load();
  };

  const filtered = SLOTS.filter((s) =>
    !search ||
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()) ||
    s.group.toLowerCase().includes(search.toLowerCase()),
  );
  const groups = Array.from(new Set(filtered.map((s) => s.group)));
  // Unique pages (for jump nav grouping)
  const pages = Array.from(new Set(groups.map(getPageFromGroup)));
  const totalCustom = Object.keys(rows).length;
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <HeidehofAdminLayout title="Bildverwaltung">
      <div className="space-y-6">

        {/* ── Stats + Actions header ── */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bildplätze</p>
              <p className="font-serif text-2xl mt-0.5">{SLOTS.length}</p>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Eigene Bilder</p>
              <p className="font-serif text-2xl mt-0.5 text-zinc-400">{totalCustom}</p>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seitenbereiche</p>
              <p className="font-serif text-2xl mt-0.5">{pages.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={scraping}
              onClick={async () => {
                setScraping(true);
                toast.loading("Heidehof-Webseite wird gescannt…", { id: "scrape" });
                try {
                  const { data, error } = await supabase.functions.invoke("scrape-heidehof-to-gallery", {
                    body: { folder: "heidehof-website" },
                  });
                  if (error) throw error;
                  toast.success(`Import fertig: ${data?.uploaded ?? 0} neu, ${data?.skipped ?? 0} vorhanden`, { id: "scrape" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Import fehlgeschlagen", { id: "scrape" });
                } finally { setScraping(false); }
              }}
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              {scraping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Webseite importieren
            </Button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Position suchen…"
                className="pl-9 w-64 bg-background/60 border-border/60" />
            </div>
          </div>
        </div>

        {/* ── Jump nav: grouped by PAGE with color coding ── */}
        {pages.length > 1 && (
          <nav className="sticky top-2 z-10 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md p-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 px-1">Schnellnavigation nach Seitenbereich</p>
            <div className="flex flex-wrap gap-1.5">
              {pages.map((page) => {
                const cfg = PAGE_CONFIG[page] ?? { navBg: "bg-muted/30 border-border/30", navText: "text-muted-foreground", icon: ImageIcon };
                const Icon = cfg.icon;
                const count = filtered.filter((s) => getPageFromGroup(s.group) === page).length;
                const customCount = filtered.filter((s) => getPageFromGroup(s.group) === page && rows[s.slug]).length;
                return (
                  <a
                    key={page}
                    href={`#page-${slugify(page)}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-opacity hover:opacity-80 ${cfg.navBg} ${cfg.navText}`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    {page}
                    <span className="opacity-60 font-normal">{customCount > 0 ? `${customCount}/${count}` : count}</span>
                  </a>
                );
              })}
            </div>
          </nav>
        )}

        {/* ── Sections by PAGE ── */}
        {pages.map((page) => {
          const cfg = pageConfig(groups.find(g => getPageFromGroup(g) === page) ?? page);
          const Icon = cfg.icon;
          const pageGroups = groups.filter(g => getPageFromGroup(g) === page);
          const pageSlots = filtered.filter(s => getPageFromGroup(s.group) === page);
          const pageCustom = pageSlots.filter(s => rows[s.slug]).length;
          const previewPage = previewPathForSlot({ slug: "", group: page + " · x" });

          return (
            <div key={page} id={`page-${slugify(page)}`} className="scroll-mt-24 space-y-4">

              {/* Page-level header */}
              <div className={`rounded-2xl border-l-4 ${cfg.header} border border-border/50 bg-card/50 px-5 py-4 flex items-center justify-between flex-wrap gap-3`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.badge}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg text-foreground leading-tight">{page}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                        {pageSlots.length} Slots · {pageCustom} eigen
                      </span>
                    </div>
                    {previewPage && (
                      <p className="text-xs text-muted-foreground mt-0.5">{previewPage.path}</p>
                    )}
                  </div>
                </div>
                {previewPage && (
                  <a href={previewPage.path} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-3 py-1.5 hover:bg-muted/40 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Seite ansehen
                  </a>
                )}
              </div>

              {/* Sub-sections within this page */}
              {pageGroups.map((g) => {
                const sub = getSubFromGroup(g);
                const subSlots = filtered.filter((s) => s.group === g);
                return (
                  <section key={g} id={`sec-${slugify(g)}`} className="scroll-mt-28">
                    {sub && sub !== page && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-sm font-medium text-muted-foreground">{sub}</h3>
                        <span className="text-xs text-muted-foreground/60">({subSlots.length})</span>
                        <div className="flex-1 h-px bg-border/40" />
                      </div>
                    )}
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-9 gap-1.5">
                      {subSlots.map((slot) => {
                        const row = rows[slot.slug];
                        const url = row?.url || "";
                        const isCustom = !!row;
                        const isAi = aiBusy === slot.slug;
                        const brightness = brightnessDraft[slot.slug] ?? row?.brightness ?? slot.defaultBrightness ?? 1.1;
                        const isVideoEntry = row?.media_type === "video";
                        const slotCfg = pageConfig(slot.group);

                        return (
                          <Card key={slot.slug} id={`slot-${slot.slug}`} className={`border bg-card/60 p-0 overflow-hidden scroll-mt-32 transition-shadow ${highlightSlug === slot.slug ? "ring-4 ring-zinc-500/70 shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)]" : ""} ${isCustom ? slotCfg.ring : "border-border/50"}`}>
                            {/* Compact preview (click to expand) */}
                            <button
                              type="button"
                              onClick={() => setExpandedSlug(expandedSlug === slot.slug ? null : slot.slug)}
                              className="relative w-full aspect-[16/10] bg-background/40 overflow-hidden block group"
                              aria-label={`Bearbeiten: ${slot.label}`}
                            >
                              {isVideoEntry ? (
                                <video src={url} className="absolute inset-0 w-full h-full object-cover" style={{ filter: `brightness(${brightness}) contrast(1.04)` }} autoPlay muted loop playsInline />
                              ) : url ? (
                                <img src={url} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" style={{ filter: `brightness(${brightness}) contrast(1.04)` }} />
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground/40">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                              {/* Top badges */}
                              <div className="absolute top-1 left-1 right-1 flex items-center justify-between gap-1 pointer-events-none">
                                <span className={`inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full border font-medium backdrop-blur-sm ${slotCfg.badge}`}>
                                  <span className={`w-1 h-1 rounded-full ${slotCfg.dot}`} />
                                  {page}
                                </span>
                                {isCustom && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-black/60 text-white/90 backdrop-blur-sm">
                                    {isVideoEntry ? <Video className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                                  </span>
                                )}
                              </div>
                              {/* Edit affordance */}
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white/90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-3 h-3" />
                              </div>
                            </button>

                            {/* Label strip */}
                            <button
                              type="button"
                              onClick={() => setExpandedSlug(expandedSlug === slot.slug ? null : slot.slug)}
                              className="w-full text-left px-2 py-1.5 border-t border-border/40 hover:bg-muted/30 transition-colors"
                            >
                              <p className="font-medium text-[11px] text-foreground leading-tight truncate">{slot.label}</p>
                              <p className="text-[9px] text-muted-foreground/60 font-mono truncate">{slot.slug}</p>
                            </button>

                            {/* Always-visible compact brightness control */}
                            <div className="px-2 py-1.5 border-t border-border/40 bg-background/20 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Helligkeit</span>
                                <span className="text-[10px] font-medium tabular-nums text-gold">{Math.round(brightness * 100)}%</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Slider
                                  value={[brightness]}
                                  min={0.35} max={1.8} step={0.05}
                                  disabled={!url}
                                  onValueChange={([next]) => setBrightnessDraft({ ...brightnessDraft, [slot.slug]: next ?? brightness })}
                                  aria-label={`Helligkeit für ${slot.label}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!url}
                                  onClick={(e) => { e.stopPropagation(); saveBrightness(slot); }}
                                  title={url ? "Helligkeit speichern" : "Erst Bild hochladen"}
                                  className="h-6 px-1.5 text-[10px] border-border/50 shrink-0"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>


                            {/* Expanded editor */}
                            {expandedSlug === slot.slug && (
                              <div className="p-2.5 space-y-2 border-t border-border/40 bg-background/30">
                                {/* Brightness */}
                                <div className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Helligkeit</span>
                                    <span className="text-xs font-medium tabular-nums">{Math.round(brightness * 100)}%</span>
                                  </div>
                                  <Slider
                                    value={[brightness]}
                                    min={0.35} max={1.8} step={0.05}
                                    onValueChange={([next]) => setBrightnessDraft({ ...brightnessDraft, [slot.slug]: next ?? brightness })}
                                    aria-label={`Helligkeit für ${slot.label}`}
                                  />
                                  <Button variant="outline" size="sm" onClick={() => saveBrightness(slot)}
                                    className="border-border/50 text-xs h-7 w-full">
                                    Helligkeit speichern
                                  </Button>
                                </div>

                                {/* Alt text */}
                                <Input
                                  placeholder="Alt-Text (SEO & Barrierefreiheit)"
                                  value={altDraft[slot.slug] ?? row?.alt ?? ""}
                                  onChange={(e) => setAltDraft({ ...altDraft, [slot.slug]: e.target.value })}
                                  onBlur={() => { if (altDraft[slot.slug] !== undefined) saveAlt(slot.slug); }}
                                  className="bg-background/60 border-border/50 text-xs h-8"
                                />

                                {/* KI Prompt */}
                                <div>
                                  <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 flex items-center gap-1 mb-1">
                                    <Wand2 className="w-2.5 h-2.5" /> KI-Prompt
                                  </label>
                                  <Textarea
                                    rows={2}
                                    placeholder={slot.suggestion}
                                    value={promptDraft[slot.slug] ?? ""}
                                    onChange={(e) => setPromptDraft({ ...promptDraft, [slot.slug]: e.target.value })}
                                    className="bg-background/60 border-border/50 text-xs"
                                  />
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-1.5">
                                  <label className="inline-flex">
                                    <input type="file" accept="image/*,video/*" className="sr-only" disabled={busy === slot.slug}
                                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(slot, f); e.target.value = ""; }} />
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background/40 border border-gold/40 text-gold hover:bg-gold/10 cursor-pointer text-xs rounded-md transition-colors">
                                      <Upload className="w-3 h-3" />
                                      {busy === slot.slug ? "Lädt…" : "Hochladen"}
                                    </span>
                                  </label>
                                  <Button size="sm" variant="outline" onClick={() => setPickerSlot(slot)}
                                    className="border-gold/40 text-gold hover:bg-gold/10 h-7 text-xs px-2.5">
                                    <FolderOpen className="w-3 h-3 mr-1" /> Galerie
                                  </Button>
                                  <Button size="sm" variant="outline" disabled={isAi}
                                    onClick={() => setGenTarget(slot)}
                                    className="border-zinc-500/40 text-zinc-400 hover:bg-zinc-500/10 h-7 text-xs px-2.5">
                                    {isAi ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                    KI
                                  </Button>
                                  <a
                                    href={`/admin/bild-bearbeiten?slug=${encodeURIComponent(slot.slug)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs rounded-md transition-colors"
                                    title="KI-Bearbeitung in eigenem Tab öffnen"
                                  >
                                    <Pencil className="w-3 h-3" /> Erweitert
                                  </a>
                                  {isCustom && (
                                    <Button variant="ghost" size="sm" onClick={() => reset(slot.slug)}
                                      className="text-destructive/70 hover:text-destructive h-7 text-xs px-2.5 ml-auto">
                                      <RefreshCw className="w-3 h-3 mr-1" /> Reset
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>Keine Bildposition gefunden.</p>
          </div>
        )}
      </div>

      {pickerSlot && (
        <SiteImageGalleryPicker
          open={!!pickerSlot}
          onClose={() => setPickerSlot(null)}
          onPick={(item) => handlePick(pickerSlot, item)}
          targetSlug={pickerSlot.slug}
        />
      )}

      {genTarget && (
        <ImageGenerationDialog
          open={!!genTarget}
          onOpenChange={(o) => !o && setGenTarget(null)}
          scope={getScopeForSlot(genTarget)}
          entityTitle={genTarget.label}
          entityDescription={genTarget.suggestion}
          defaultPrompt={promptDraft[genTarget.slug] ?? ""}
          onGenerate={async ({ prompt, referenceImageUrls, references, title }) => {
            // Note: generate-site-image updates site_images. We don't save the modified title/description to SLOTS catalog since it's hardcoded, but we invoke image generation.
            await runGenerate(genTarget, prompt, referenceImageUrls, references);
          }}
        />
      )}
    </HeidehofAdminLayout>
  );
}
