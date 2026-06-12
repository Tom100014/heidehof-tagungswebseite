import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AdminRole } from "@/utils/admin-security";
import {
  Globe, Mic, DoorOpen, Building2, FileText, Image as ImageIcon, BookOpen, Sparkles,
  Armchair, Mail, Settings as SettingsIcon, ArrowRight, Palette, History, HelpCircle, ChefHat,
  Plug, Eye, Code2, Send, Target, ExternalLink, CheckCircle2, MessageSquare,
  KeyRound, UserPlus, Loader2,
} from "lucide-react";

interface SettingLink {
  to: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

function LinkGrid({ items }: { items: SettingLink[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(({ to, title, desc, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group rounded-xl bg-card border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-foreground text-sm">{title}</h4>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-foreground transition-all flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

const SECTIONS: {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingLink[];
}[] = [
  {
    id: "webseite",
    title: "Webseite",
    desc: "Texte, Bilder, SEO und alle öffentlich sichtbaren Inhalte",
    icon: Globe,
    items: [
      { to: "/admin/inhalte", title: "Texte (CMS)", desc: "Alle Texte der öffentlichen Webseite bearbeiten.", icon: FileText },
      { to: "/admin/images", title: "Bilder & Hero-Bilder", desc: "Hintergründe, Sektionen, Galerien.", icon: ImageIcon },
      { to: "/admin/impressionen", title: "Impressionen", desc: "Galerie-Slider auf der Startseite.", icon: ImageIcon },
      { to: "/admin/partners", title: "Partner-Logos", desc: "Logo-Marquee mit Partner-Verlinkungen.", icon: Building2 },
      { to: "/admin/menu-cards", title: "Speisekarten (öffentlich)", desc: "Veröffentlichte PDF-Speisekarten.", icon: FileText },
    ],
  },
  {
    id: "clara",
    title: "Clara · Sprachassistent",
    desc: "Wissen, Stimme, Medien und Prompts für die KI",
    icon: Mic,
    items: [
      { to: "/admin/knowledge", title: "Wissensbasis", desc: "Texte, FAQs und Fakten für Clara.", icon: BookOpen },
      
      { to: "/admin/clara-media", title: "Medienbank", desc: "Bilder, die Clara Gästen zeigen kann.", icon: ImageIcon },
      { to: "/admin/clara-cockpit", title: "Cockpit & Prompts", desc: "Prompts, Tools, System-Konfiguration.", icon: Sparkles },
      { to: "/admin/clara-cockpit", title: "Stimme & Sprache", desc: "Cartesia-Stimme, Voice-ID, Modell, STT.", icon: Mic },
      { to: "/admin/image-studio", title: "Bild-Studio", desc: "KI-Bilder & Referenz-Templates.", icon: Palette },
    ],
  },
  {
    id: "raeume",
    title: "Räume & Setups",
    desc: "Tagungsräume, Bestuhlungs-Varianten, Referenzbilder",
    icon: DoorOpen,
    items: [
      { to: "/admin/rooms", title: "Tagungsräume", desc: "Räume, Kapazitäten, Ausstattung, Bilder.", icon: DoorOpen },
      { to: "/admin/setups", title: "Bestuhlungen", desc: "Theater, U-Form, Bankett – mit Referenzfotos.", icon: Armchair },
      { to: "/admin/dishes", title: "Tagungsmenü-Vorlagen", desc: "Gerichte & Referenzbilder für KI-Generierung.", icon: ChefHat },
    ],
  },
  {
    id: "kraftwerk",
    title: "Erweiterungen & Automation",
    desc: "API-Hub, E-Mail-Vorlagen, Clara-Widget, Seiten-Sichtbarkeit & Lead-Agent",
    icon: Plug,
    items: [
      { to: "/admin/integrations", title: "Integrationen & API-Hub", desc: "Alle externen Dienste & API-Keys aktivieren/deaktivieren.", icon: Plug },
      { to: "/admin/email-templates", title: "E-Mail-Vorlagen", desc: "Layouts für jede Anfrage-Art bearbeiten & Vorschau.", icon: Mail },
      { to: "/admin/seiten-sichtbarkeit", title: "Seiten-Sichtbarkeit", desc: "Unterseiten & Landing-Sektionen ein/aus, Reihenfolge.", icon: Eye },
      { to: "/admin/lead-agent", title: "Lead-Agent", desc: "B2B-Firmensuche, CSV-Import & automatisiertes Outreach.", icon: Target },
    ],
  },
  {
    id: "stammdaten",
    title: "Hotel-Stammdaten & E-Mail",
    desc: "Empfänger, Versand-Adressen, System-Einstellungen",
    icon: Mail,
    items: [
      { to: "/admin/email-routing", title: "E-Mail-Weiterleitung pro Anfrage", desc: "Pro Bereich (Tagung, Bar, Beauty …) eigene Empfänger festlegen.", icon: Mail },
      { to: "/admin/settings", title: "Küchen-Tagesreport", desc: "Empfänger des täglichen 10:30-Reports.", icon: ChefHat },
      { to: "/admin/aktivitaet", title: "Aktivitätsprotokoll", desc: "Audit-Log aller Admin-Aktionen.", icon: History },
      { to: "/admin/hilfe", title: "Hilfe & Einarbeitung", desc: "Betriebshandbuch und Tutorials.", icon: HelpCircle },
    ],
  },
];

function AdminAccessPanel() {
  const [newPassword, setNewPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("service");
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Das neue Passwort braucht mindestens 8 Zeichen");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Admin-Passwort wurde geändert");
      setNewPassword("");
    } catch (err: any) {
      toast.error("Passwort konnte nicht geändert werden", { description: err.message || String(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  const inviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Bitte E-Mail-Adresse eintragen");
      return;
    }
    setSendingInvite(true);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "invite_user",
          email: inviteEmail.trim(),
          role: inviteRole,
          redirectTo: `${window.location.origin}/admin/reset-password`,
        },
      });
      if (error) throw error;
      toast.success("Zugang wurde eingeladen");
      setInviteEmail("");
    } catch (err: any) {
      toast.error("Admin konnte nicht eingeladen werden", {
        description: err.message || "Bitte prüfen, ob die Supabase Function admin-users deployed ist.",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-[hsl(var(--apple))]" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-foreground">Admin-Zugänge</h3>
          <p className="text-xs text-muted-foreground">Passwort ändern, Passwort-Reset nutzen und weitere Admins einladen.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <form onSubmit={updatePassword} className="rounded-xl border border-border bg-muted/25 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4" /> Eigenes Passwort ändern</h4>
            <p className="text-xs text-muted-foreground mt-1">Gilt für den aktuell angemeldeten Admin.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">Neues Passwort</Label>
            <Input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <Button type="submit" disabled={savingPassword || newPassword.length < 8}>
            {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Passwort speichern
          </Button>
        </form>

        <form onSubmit={inviteAdmin} className="rounded-xl border border-border bg-muted/25 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><UserPlus className="w-4 h-4" /> Fachzugang einladen</h4>
            <p className="text-xs text-muted-foreground mt-1">Service, Küche, Tagung oder Direktion erhalten jeweils nur ihre passende Ansicht.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-invite-email">E-Mail-Adresse</Label>
            <Input
              id="admin-invite-email"
              type="email"
              autoComplete="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@hotel.de"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-invite-role">Zugang / Rolle</Label>
            <select
              id="admin-invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="service">Restaurant, Bar & Bestellungen</option>
              <option value="kitchen">Küche</option>
              <option value="conference">Tagungsanfragen & Verkauf</option>
              <option value="director">Hoteldirektor: komplette Ansicht</option>
              <option value="admin">Admin: komplette Technik-Ansicht</option>
            </select>
          </div>
          <Button type="submit" disabled={sendingInvite || !inviteEmail.trim()}>
            {sendingInvite && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Einladung senden
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default function AdminEinstellungen() {
  return (
    <HeidehofAdminLayout title="Einstellungen">
      <div className="space-y-5 max-w-[1400px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">System &amp; Konfiguration</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Alle Einstellungen an einem Ort</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Klicke eine Sektion auf, um die Untereinstellungen zu sehen. So bleibt der Bereich übersichtlich.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <a href="https://hotel-dream-guide.lovable.app" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-all flex items-start gap-3 hover:shadow-sm">
            <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground flex items-center gap-1">Webseite <ExternalLink className="w-3 h-3" /></div>
              <p className="text-xs text-muted-foreground truncate">hotel-dream-guide.lovable.app</p>
            </div>
          </a>
          <Link to="/admin/integrations" className="rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-all flex items-start gap-3 hover:shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-zinc-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">API-Systeme</div>
              <p className="text-xs text-muted-foreground">Verbindungen ansehen und konfigurieren</p>
            </div>
          </Link>
          <Link to="/admin/lead-agent" className="rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-all flex items-start gap-3 hover:shadow-sm">
            <Target className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">Leadgenerierung</div>
              <p className="text-xs text-muted-foreground">Suche, Import und Versand starten</p>
            </div>
          </Link>
        </div>

        <AdminAccessPanel />

        <Card className="bg-card border-border p-2 sm:p-4">
          <Accordion type="multiple" className="w-full">
            {SECTIONS.map(({ id, title, desc, icon: Icon, items }) => (
              <AccordionItem key={id} value={id} className="border-b border-border last:border-0">
                <AccordionTrigger className="hover:no-underline py-4 px-2 group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-data-[state=open]:bg-primary transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-data-[state=open]:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-foreground">{title}</h3>
                      <p className="text-xs text-muted-foreground font-normal">{desc}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-4">
                  <LinkGrid items={items} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </HeidehofAdminLayout>
  );
}
