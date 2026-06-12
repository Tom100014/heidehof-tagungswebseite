import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  diff: Record<string, unknown>;
  created_at: string;
}

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!mounted) return;
      if (!error) setEntries((data as AuditEntry[]) ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <HeidehofAdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Aktivitäts-Protokoll</h1>
            <p className="text-sm text-muted-foreground">
              Letzte 200 Admin-Aktionen — wer hat was wann geändert.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Lädt…
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Noch keine Aktionen protokolliert.
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <Card key={e.id} className="p-3 sm:p-4 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{e.action}</Badge>
                    {e.entity && (
                      <Badge variant="outline" className="text-xs">{e.entity}{e.entity_id ? ` · ${e.entity_id.slice(0, 8)}` : ""}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{e.actor_email ?? "—"}</span>
                  </div>
                  {Object.keys(e.diff || {}).length > 0 && (
                    <pre className="mt-2 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-40">
                      {JSON.stringify(e.diff, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("de-DE")}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
};

export default AdminAuditLog;
