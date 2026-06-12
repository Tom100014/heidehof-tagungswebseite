import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, RefreshCw, FlaskConical, Check, X } from "lucide-react";
import { toast } from "sonner";

interface CallLogRow {
  id: string;
  call_id: string | null;
  agent_id: string | null;
  tool_name: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "medium" });

export const CartesiaCallLogCard = () => {
  const [rows, setRows] = useState<CallLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cartesia_call_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Call-Log konnte nicht geladen werden");
      console.error(error);
    } else {
      setRows((data ?? []) as CallLogRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("cartesia-call-log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cartesia_call_log" }, () => {
        void load();
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  const runTestCall = async () => {
    setTesting(true);
    try {
      const SUPABASE_URL = "https://qkwgqdyamomvaihbofbw.supabase.co";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cartesia-phone-handler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: "send_inquiry",
          session_id: `test-${Date.now()}`,
          agent_id: "agent_gjYusgM21heczyikufbJ4P",
          arguments: {
            name: "Admin Testanfrage",
            telefon: "+49 8458 6400",
            email: "test@hotel-heidehof.de",
            anlass: "Testanruf via Admin-Cockpit",
            personen: "1",
            datum: "heute",
            nachricht: "Dies ist ein automatischer Test des Telefonagenten.",
            confirmed_summary: "Test: Anfrage wurde aus dem Admin-Cockpit ausgelöst.",
          },
        }),
      });
      const json = await res.json();
      if (json.success) toast.success("Test-Call erfolgreich – Eintrag wird unten angezeigt.");
      else toast.error(`Test fehlgeschlagen: ${json.message ?? json.error ?? "unbekannt"}`);
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(false);
      setTimeout(() => void load(), 800);
    }
  };

  const okCount = rows.filter((r) => r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="size-4" /> Telefonagent · Live-Anruf-Log
          <Badge variant="outline" className="ml-2">{rows.length} Einträge</Badge>
          {rows.length > 0 && (
            <Badge variant={okCount === rows.length ? "default" : "destructive"} className="text-[10px]">
              {okCount}/{rows.length} OK
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Aktualisieren
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void runTestCall()} disabled={testing}>
            <FlaskConical className="size-3.5 mr-1.5" /> {testing ? "Sende …" : "Test-Anruf simulieren"}
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Noch keine Tool-Aufrufe vom Telefonagenten. Test-Anruf simulieren, um die Pipeline zu prüfen.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded border divide-y">
            {rows.map((r) => (
              <details key={r.id} className="group">
                <summary className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 text-sm">
                  {r.success
                    ? <Check className="size-4 text-green-600 flex-shrink-0" />
                    : <X className="size-4 text-red-600 flex-shrink-0" />}
                  <Badge variant="outline" className="text-[10px] font-mono">{r.tool_name}</Badge>
                  <span className="text-xs text-muted-foreground flex-1 truncate">
                    {r.call_id ?? "—"}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmtTime(r.created_at)}</span>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2 bg-muted/20">
                  {r.error_message && (
                    <div className="text-xs text-red-600">Fehler: {r.error_message}</div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Eingabe</div>
                    <pre className="text-[11px] bg-background rounded p-2 overflow-x-auto">
                      {JSON.stringify(r.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Antwort</div>
                    <pre className="text-[11px] bg-background rounded p-2 overflow-x-auto">
                      {JSON.stringify(r.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CartesiaCallLogCard;
