import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LeadsHistory = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("lead_email_drafts")
        .select("id, subject, status, sent_at, created_at, error_message, lead:leads(company, email, city)")
        .in("status", ["sent", "error", "discarded"])
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(200);
      setItems(data || []);
    })();
  }, []);

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3">Zeitpunkt</th><th className="p-3">Firma</th><th className="p-3">E-Mail</th>
            <th className="p-3">Betreff</th><th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(d.sent_at || d.created_at).toLocaleString("de-DE")}</td>
              <td className="p-3 font-medium">{d.lead?.company}</td>
              <td className="p-3">{d.lead?.email}</td>
              <td className="p-3 max-w-xs truncate">{d.subject}</td>
              <td className="p-3">
                <Badge variant={d.status === "sent" ? "default" : d.status === "error" ? "destructive" : "outline"}>{d.status}</Badge>
                {d.error_message && <p className="text-xs text-destructive mt-1">{d.error_message}</p>}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Noch keine Versandhistorie.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
};

export default LeadsHistory;
