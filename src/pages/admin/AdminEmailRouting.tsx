import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Mail, Save } from "lucide-react";
import { toast } from "sonner";

interface Route {
  id: string;
  category_key: string;
  label: string;
  emails: string[];
  enabled: boolean;
}

export default function AdminEmailRouting() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("category_email_routes")
      .select("*")
      .order("label");
    if (error) toast.error("Laden fehlgeschlagen: " + error.message);
    else setRoutes((data ?? []) as Route[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (route: Route) => {
    setSaving(route.id);
    const { error } = await supabase
      .from("category_email_routes")
      .update({ emails: route.emails, enabled: route.enabled })
      .eq("id", route.id);
    setSaving(null);
    if (error) toast.error("Speichern fehlgeschlagen: " + error.message);
    else toast.success(`${route.label} gespeichert`);
  };

  const addEmail = (route: Route) => {
    const email = (newEmail[route.id] || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Ungültige E-Mail");
      return;
    }
    if (route.emails.includes(email)) return;
    const updated = { ...route, emails: [...route.emails, email] };
    setRoutes(rs => rs.map(r => r.id === route.id ? updated : r));
    setNewEmail(s => ({ ...s, [route.id]: "" }));
    save(updated);
  };

  const removeEmail = (route: Route, email: string) => {
    const updated = { ...route, emails: route.emails.filter(e => e !== email) };
    setRoutes(rs => rs.map(r => r.id === route.id ? updated : r));
    save(updated);
  };

  const toggle = (route: Route, enabled: boolean) => {
    const updated = { ...route, enabled };
    setRoutes(rs => rs.map(r => r.id === route.id ? updated : r));
    save(updated);
  };

  return (
    <HeidehofAdminLayout title="E-Mail-Weiterleitung pro Anfrage">
      <div className="max-w-4xl space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-foreground">E-Mail-Weiterleitung</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lege pro Anfrage-Bereich fest, an welche E-Mail-Adressen neue Anfragen automatisch weitergeleitet werden.
            Mehrere Empfänger pro Bereich möglich.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Lade…
          </div>
        ) : (
          <div className="grid gap-3">
            {routes.map(route => (
              <Card key={route.id} className="bg-card border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-foreground">{route.label}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{route.category_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === route.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    <Switch
                      checked={route.enabled}
                      onCheckedChange={(v) => toggle(route, v)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {route.emails.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Keine Empfänger – Weiterleitung inaktiv</p>
                  ) : (
                    route.emails.map(email => (
                      <div key={email} className="flex items-center justify-between gap-2 text-sm bg-muted/50 rounded-lg px-3 py-1.5">
                        <span className="text-foreground font-mono text-xs">{email}</span>
                        <button
                          onClick={() => removeEmail(route, email)}
                          className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Entfernen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="empfaenger@hotel-heidehof.de"
                    value={newEmail[route.id] ?? ""}
                    onChange={(e) => setNewEmail(s => ({ ...s, [route.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") addEmail(route); }}
                    className="text-sm h-9"
                  />
                  <Button size="sm" onClick={() => addEmail(route)}>
                    <Plus className="w-3 h-3 mr-1" /> Hinzufügen
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
