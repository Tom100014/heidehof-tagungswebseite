import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Save, Send, History as HistoryIcon } from "lucide-react";

interface Blocks {
  intro?: string;
  cta_label?: string;
  cta_url?: string;
  footer?: string;
  header_image?: string;
}
interface Template {
  key: string;
  label: string;
  category: string;
  subject: string;
  preheader: string | null;
  blocks: Blocks;
  variables: string[];
  is_active: boolean;
}

function renderPreview(t: Template) {
  const subject = t.subject || "(ohne Betreff)";
  const intro = t.blocks.intro ?? "";
  const cta = t.blocks.cta_label
    ? `<p style="text-align:center;margin:24px 0;"><a href="${t.blocks.cta_url ?? "#"}" style="background:#1A1A1A;color:#F5EFE3;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">${t.blocks.cta_label}</a></p>`
    : "";
  const footer = t.blocks.footer ?? "";
  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5DCC7;border-radius:12px;overflow:hidden;">
      <div style="background:#1A1A1A;color:#F5EFE3;padding:24px;text-align:center;font-size:18px;letter-spacing:0.2em;">HEIDEHOF</div>
      <div style="padding:32px;color:#1A1A1A;line-height:1.6;font-size:14px;">
        <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;">${subject}</h2>
        <div>${intro.replace(/\n/g, "<br>")}</div>
        ${cta}
        <hr style="border:0;border-top:1px solid #E5DCC7;margin:24px 0;">
        <p style="color:#1A1A1A99;font-size:12px;">${footer}</p>
      </div>
    </div>
  `;
}

export default function AdminEmailTemplates() {
  const [list, setList] = useState<Template[]>([]);
  const [active, setActive] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("category")
      .order("label");
    if (error) toast.error(error.message);
    const rows = (data as Template[]) || [];
    setList(rows);
    if (!active && rows.length) setActive(rows[0]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!active) return;
    setSaving(true);
    // history
    await supabase.from("email_template_history").insert({
      template_key: active.key,
      subject: active.subject,
      preheader: active.preheader,
      blocks: active.blocks as never,
    });
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: active.subject,
        preheader: active.preheader,
        blocks: active.blocks as never,
        is_active: active.is_active,
      })
      .eq("key", active.key);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vorlage gespeichert");
    load();
  };

  const sendTest = async () => {
    if (!testEmail || !active) return;
    toast.info("Test-Versand wird in der nächsten Iteration aktiviert.");
  };

  const updateBlock = (k: keyof Blocks, v: string) =>
    active && setActive({ ...active, blocks: { ...active.blocks, [k]: v } });

  return (
    <HeidehofAdminLayout title="E-Mail-Vorlagen">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4 max-w-[1500px]">
        {/* Liste */}
        <Card className="bg-white border-border p-3 h-fit lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <h3 className="font-serif text-base text-foreground mb-2 px-2">Vorlagen</h3>
          {loading ? (
            <div className="text-sm text-muted-foreground px-2">Lade …</div>
          ) : (
            <div className="space-y-1">
              {list.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    active?.key === t.key
                      ? "bg-[#1A1A1A] text-[#F5EFE3]"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{t.label}</span>
                    {!t.is_active && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        aus
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-60 mt-0.5">{t.category}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Editor */}
        {active && (
          <Card className="bg-white border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg">{active.label}</h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Aktiv</Label>
                <Switch
                  checked={active.is_active}
                  onCheckedChange={(v) => setActive({ ...active, is_active: v })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Betreff</Label>
              <Input
                value={active.subject}
                onChange={(e) => setActive({ ...active, subject: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Pre-Header (Vorschautext)</Label>
              <Input
                value={active.preheader ?? ""}
                onChange={(e) => setActive({ ...active, preheader: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Intro-Text</Label>
              <Textarea
                rows={6}
                value={active.blocks.intro ?? ""}
                onChange={(e) => updateBlock("intro", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">CTA-Beschriftung</Label>
                <Input
                  value={active.blocks.cta_label ?? ""}
                  onChange={(e) => updateBlock("cta_label", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">CTA-Link</Label>
                <Input
                  value={active.blocks.cta_url ?? ""}
                  onChange={(e) => updateBlock("cta_url", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Footer</Label>
              <Textarea
                rows={3}
                value={active.blocks.footer ?? ""}
                onChange={(e) => updateBlock("footer", e.target.value)}
              />
            </div>

            {active.variables.length > 0 && (
              <div>
                <Label className="text-xs">Verfügbare Variablen (klicken zum Kopieren)</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {active.variables.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${v}}}`);
                        toast.success(`{{${v}}} kopiert`);
                      }}
                      className="text-xs font-mono bg-muted hover:bg-[#E5DCC7] px-2 py-1 rounded"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={sendTest}>
                <Send className="w-4 h-4 mr-1" /> Test
              </Button>
              <Button onClick={save} disabled={saving}>
                <Save className="w-4 h-4 mr-1" /> {saving ? "Speichert …" : "Speichern"}
              </Button>
            </div>
          </Card>
        )}

        {/* Preview */}
        {active && (
          <Card className="bg-muted border-border p-4 h-fit lg:sticky lg:top-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Live-Vorschau
            </div>
            <div dangerouslySetInnerHTML={{ __html: renderPreview(active) }} />
          </Card>
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
