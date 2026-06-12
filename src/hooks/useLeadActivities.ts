import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadActivity {
  id: string;
  lead_id: string;
  deal_id: string | null;
  type: string;
  payload: any;
  occurred_at: string;
  lead?: { company: string };
}

export function useLeadActivities(opts?: { leadId?: string; limit?: number }) {
  const [items, setItems] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("lead_activities")
      .select("*, lead:leads(company)")
      .order("occurred_at", { ascending: false })
      .limit(opts?.limit ?? 20);
    if (opts?.leadId) q = q.eq("lead_id", opts.leadId);
    const { data } = await q;
    setItems((data as LeadActivity[]) || []);
    setLoading(false);
  }, [opts?.leadId, opts?.limit]);

  useEffect(() => { void load(); }, [load]);
  return { items, loading, reload: load };
}
