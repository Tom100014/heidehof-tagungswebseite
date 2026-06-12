import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  HelpCircle, Inbox, DoorOpen, ChefHat, BookOpen, Settings,
  UtensilsCrossed, Image as ImageIcon, ArrowRight, PlayCircle,
} from "lucide-react";

interface HelpText {
  id: string;
  key: string;
  section: string;
  title: string;
  body_md: string;
  video_url: string | null;
  sort_order: number;
}

const SECTION_META: Record<string, { label: string; icon: typeof Inbox; route?: string; description: string }> = {
  overview:  { label: "Überblick",        icon: HelpCircle,       route: "/admin",                  description: "Startseite & schneller Zugriff" },
  inbox:     { label: "Anfragen-Inbox",   icon: Inbox,            route: "/admin/inbox",            description: "Tagungsanfragen bearbeiten" },
  rooms:     { label: "Räume",            icon: DoorOpen,         route: "/admin/rooms",            description: "Tagungsräume & Bilder" },
  kitchen:   { label: "Küche",            icon: ChefHat,          route: "/admin/kitchen",          description: "Küchenplan & Bestellungen" },
  menu:      { label: "Tagesmenü",        icon: UtensilsCrossed,  route: "/admin/conference-menu", description: "Speisen pro Tag" },
  images:    { label: "Bilder & Medien",  icon: ImageIcon,        route: "/admin/images",           description: "Webseiten-Bilder verwalten" },
  knowledge: { label: "Wissensbasis",     icon: BookOpen,         route: "/admin/knowledge",        description: "Inhalte für Clara KI" },
  settings:  { label: "Einstellungen",    icon: Settings,         route: "/admin/settings",         description: "Empfänger, Marken-Texte & mehr" },
};

const AdminHelp = () => {
  const [texts, setTexts] = useState<HelpText[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("admin_help_texts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (mounted) setTexts((data as HelpText[]) ?? []);
    })();
    return () => { mounted = false; };
  }, []);

  const grouped = texts.reduce<Record<string, HelpText[]>>((acc, t) => {
    (acc[t.section] ||= []).push(t);
    return acc;
  }, {});

  const sections = Array.from(new Set([
    ...Object.keys(SECTION_META),
    ...Object.keys(grouped),
  ]));

  return (
    <HeidehofAdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        <header className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hilfe & Einarbeitung</h1>
            <p className="text-muted-foreground mt-1">
              Schritt-für-Schritt-Anleitungen, Videos und Tipps für jeden Bereich des Admins.
            </p>
          </div>
        </header>

        <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <h2 className="font-semibold mb-1">Erste Schritte</h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Trage in <Link className="underline" to="/admin/settings">Einstellungen</Link> die E-Mail der Küche ein.</li>
            <li>Prüfe deine <Link className="underline" to="/admin/rooms">Tagungsräume</Link> & Bilder.</li>
            <li>Lege das <Link className="underline" to="/admin/conference-menu">Tagesmenü</Link> für die kommende Woche an.</li>
            <li>Sende einen <Link className="underline" to="/admin/settings">Test-Küchenreport</Link>.</li>
          </ol>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => {
            const meta = SECTION_META[sec] ?? { label: sec, icon: HelpCircle, description: "" };
            const Icon = meta.icon;
            const items = grouped[sec] ?? [];
            return (
              <Card key={sec} className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{meta.label}</h3>
                    {meta.description && (
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Noch keine Hilfetexte hinterlegt.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((t) => (
                      <div key={t.id} className="text-sm">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-muted-foreground whitespace-pre-line text-xs mt-0.5">
                          {t.body_md}
                        </div>
                        {t.video_url && (
                          <a href={t.video_url} target="_blank" rel="noreferrer"
                             className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline">
                            <PlayCircle className="h-3.5 w-3.5" /> Video ansehen
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {meta.route && (
                  <Button asChild variant="outline" size="sm" className="mt-auto self-start">
                    <Link to={meta.route}>
                      Bereich öffnen <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="p-5">
          <h2 className="font-semibold mb-2">Tastatur-Shortcuts</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd> — Schnellsuche / Command-Palette</li>
            <li><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> — Dialog schließen</li>
          </ul>
        </Card>
      </div>
    </HeidehofAdminLayout>
  );
};

export default AdminHelp;
