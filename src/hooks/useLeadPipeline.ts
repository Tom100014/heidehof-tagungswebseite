import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DealStage = "lead" | "first_contact" | "qualified" | "viewing_offer" | "negotiation" | "won" | "lost";

export const STAGES: { id: DealStage; label: string; tone: string }[] = [
  { id: "lead", label: "Lead", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { id: "first_contact", label: "Erstkontakt", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { id: "qualified", label: "Qualifiziert", tone: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  { id: "viewing_offer", label: "Besichtigung / Angebot", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "negotiation", label: "Verhandlung", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { id: "won", label: "Gewonnen", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "lost", label: "Verloren", tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
];

export interface Deal {
  id: string;
  lead_id: string;
  stage: DealStage;
  estimated_value: number;
  event_type: string | null;
  expected_persons: number | null;
  expected_date: string | null;
  probability: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    company: string;
    contact_name: string | null;
    email: string | null;
    city: string | null;
    industry: string | null;
    lead_score: number;
    status: string;
  };
}

export function useLeadPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("pipeline_deals")
      .select("*, lead:leads(id, company, contact_name, email, city, industry, lead_score, status)")
      .order("updated_at", { ascending: false });
    if (!error) setDeals((data as Deal[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStage = useCallback(async (dealId: string, stage: DealStage) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    const { error } = await (supabase as any).from("pipeline_deals").update({ stage }).eq("id", dealId);
    if (error) await load();
    else {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        await (supabase as any).from("lead_activities").insert({
          lead_id: deal.lead_id,
          deal_id: dealId,
          type: "stage_change",
          payload: { from: deal.stage, to: stage },
        });
      }
    }
  }, [deals, load]);

  return { deals, loading, reload: load, updateStage };
}
