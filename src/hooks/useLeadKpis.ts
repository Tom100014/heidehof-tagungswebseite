import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadKpis {
  leadsTotal: number;
  leadsNew7d: number;
  leadsNew30d: number;
  contacted: number;
  qualified: number;
  won: number;
  lost: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  pipelineValue: number;
  pipelineCount: number;
  conversionRate: number;
  funnel: { stage: string; label: string; count: number }[];
  byCampaign: { name: string; leads: number; sent: number; replied: number }[];
  byIndustry: { industry: string; count: number }[];
}

const empty: LeadKpis = {
  leadsTotal: 0, leadsNew7d: 0, leadsNew30d: 0, contacted: 0, qualified: 0, won: 0, lost: 0,
  emailsSent: 0, emailsOpened: 0, emailsClicked: 0, emailsReplied: 0,
  openRate: 0, clickRate: 0, replyRate: 0,
  pipelineValue: 0, pipelineCount: 0, conversionRate: 0,
  funnel: [], byCampaign: [], byIndustry: [],
};

export function useLeadKpis() {
  const [data, setData] = useState<LeadKpis>(empty);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400e3).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400e3).toISOString();

    const [leads, leads7, leads30, contacted, qualified, won, lost,
      sent, opened, clicked, replied, deals, campaigns, drafts] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", d7),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", d30),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["contacted", "opened", "clicked", "replied", "qualified", "offer", "won"]),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["qualified", "offer", "won"]),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won"),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["lost", "no_interest"]),
      supabase.from("email_events").select("id", { count: "exact", head: true }).eq("type", "sent"),
      supabase.from("email_events").select("id", { count: "exact", head: true }).eq("type", "opened"),
      supabase.from("email_events").select("id", { count: "exact", head: true }).eq("type", "clicked"),
      supabase.from("email_events").select("id", { count: "exact", head: true }).eq("type", "replied"),
      (supabase as any).from("pipeline_deals").select("estimated_value, stage"),
      supabase.from("lead_campaigns").select("id, name, stats"),
      supabase.from("lead_email_drafts").select("id, status, campaign_id"),
    ]);

    // Sent fallback: use drafts if no events yet
    const sentFromDrafts = (drafts.data || []).filter((d: any) => d.status === "sent").length;
    const sentCount = (sent.count || 0) || sentFromDrafts;

    const dealsArr = (deals.data as any[]) || [];
    const pipelineDeals = dealsArr.filter((d) => !["won", "lost"].includes(d.stage));
    const pipelineValue = pipelineDeals.reduce((s, d) => s + Number(d.estimated_value || 0), 0);

    // Funnel
    const wonCount = won.count || 0;
    const contactedCount = contacted.count || 0;
    const qualifiedCount = qualified.count || 0;
    const repliedCount = replied.count || 0;
    const total = leads.count || 0;
    const funnel = [
      { stage: "lead", label: "Leads", count: total },
      { stage: "contacted", label: "Kontaktiert", count: contactedCount },
      { stage: "replied", label: "Geantwortet", count: repliedCount },
      { stage: "qualified", label: "Qualifiziert", count: qualifiedCount },
      { stage: "won", label: "Gewonnen", count: wonCount },
    ];

    // by campaign
    const draftsByCampaign: Record<string, { sent: number }> = {};
    for (const d of (drafts.data as any[]) || []) {
      const k = d.campaign_id || "_";
      draftsByCampaign[k] ||= { sent: 0 };
      if (d.status === "sent") draftsByCampaign[k].sent++;
    }
    const { data: leadsByCampaignData } = await supabase.from("leads").select("campaign_id");
    const leadsByCampaign: Record<string, number> = {};
    for (const l of (leadsByCampaignData as any[]) || []) {
      const k = l.campaign_id || "_";
      leadsByCampaign[k] = (leadsByCampaign[k] || 0) + 1;
    }
    const byCampaign = (campaigns.data as any[] || []).map((c) => ({
      name: c.name,
      leads: leadsByCampaign[c.id] || 0,
      sent: draftsByCampaign[c.id]?.sent || 0,
      replied: 0,
    }));

    // by industry
    const { data: byInd } = await supabase.from("leads").select("industry").limit(1000);
    const indMap: Record<string, number> = {};
    for (const r of (byInd as any[]) || []) {
      const k = r.industry?.trim() || "Ohne Branche";
      indMap[k] = (indMap[k] || 0) + 1;
    }
    const byIndustry = Object.entries(indMap)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    setData({
      leadsTotal: total,
      leadsNew7d: leads7.count || 0,
      leadsNew30d: leads30.count || 0,
      contacted: contactedCount,
      qualified: qualifiedCount,
      won: wonCount,
      lost: lost.count || 0,
      emailsSent: sentCount,
      emailsOpened: opened.count || 0,
      emailsClicked: clicked.count || 0,
      emailsReplied: repliedCount,
      openRate: sentCount ? Math.round(((opened.count || 0) / sentCount) * 100) : 0,
      clickRate: sentCount ? Math.round(((clicked.count || 0) / sentCount) * 100) : 0,
      replyRate: sentCount ? Math.round((repliedCount / sentCount) * 100) : 0,
      pipelineValue,
      pipelineCount: pipelineDeals.length,
      conversionRate: total ? Math.round((wonCount / total) * 100) : 0,
      funnel, byCampaign, byIndustry,
    });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, reload: load };
}
