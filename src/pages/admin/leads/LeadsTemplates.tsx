import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Upload, Trash2 } from "lucide-react";

const DEFAULT_HTML = `<p>Guten Tag {{contact_name}},</p>
<p>im Hotel Der Heidehof bieten wir Tagungspauschalen ab 65 € p. P., flexible Seminarräume und ein 5-Sterne-Restaurant — ideal für {{company}}.</p>
<p>Gerne stelle ich Ihnen ein passendes Angebot zusammen. Wann passt ein kurzes Telefonat?</p>
<p>Herzliche Grüße<br/>Heidehof Team</p>`;

const LeadsTemplates = () => {
  const [template, setTemplate] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("email_templates").select("*").eq("key", "lead-outreach").maybeSingle();
    if (data) {
      setTemplate(data);
      setImages((data.blocks as any)?.images || []);
    } else {
      setTemplate({ key: "lead-outreach", label: "Lead-Akquise", category: "marketing", subject: "Tagungsmöglichkeiten im Heidehof", blocks: { intro: DEFAULT_HTML, cta_label: "Tagungsangebot ansehen", cta_url: "https://hotel-dream-guide.lovable.app/tagungspauschalen" }, variables: ["company","contact_name","personalized_intro"], is_active: true });
    }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    const blocks = { ...(template.blocks || {}), images };
    const payload = { ...template, blocks, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("email_templates").upsert(payload, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Vorlage gespeichert");
  };

  const resetAI = () => {
    setTemplate({ ...template, subject: "Tagungsmöglichkeiten im Heidehof", blocks: { ...(template.blocks || {}), intro: DEFAULT_HTML, cta_label: "Tagungsangebot ansehen", cta_url: "https://hotel-dream-guide.lovable.app/tagungspauschalen" } });
    toast.success("KI-Vorlage zurückgesetzt");
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `templates/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("lead-assets").upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("lead-assets").getPublicUrl(path);
    setImages([...images, { url: pub.publicUrl, alt: file.name, path }]);
    toast.success("Bild hochgeladen");
  };

  if (!template) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Standard-Vorlage „Lead-Akquise"</h2>
          <Button variant="outline" size="sm" onClick={resetAI}><Sparkles className="w-4 h-4 mr-1" /> KI-Reset</Button>
        </div>
        <div><Label>Betreff</Label><Input value={template.subject || ""} onChange={(e) => setTemplate({ ...template, subject: e.target.value })} /></div>
        <div><Label>HTML-Body</Label><Textarea rows={14} value={template.blocks?.intro || ""} onChange={(e) => setTemplate({ ...template, blocks: { ...(template.blocks||{}), intro: e.target.value } })} className="font-mono text-xs" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>CTA-Label</Label><Input value={template.blocks?.cta_label || ""} onChange={(e) => setTemplate({ ...template, blocks: { ...(template.blocks||{}), cta_label: e.target.value } })} /></div>
          <div><Label>CTA-URL</Label><Input value={template.blocks?.cta_url || ""} onChange={(e) => setTemplate({ ...template, blocks: { ...(template.blocks||{}), cta_url: e.target.value } })} /></div>
        </div>
        <p className="text-xs text-muted-foreground">Variablen: <code>{"{{company}}"}</code>, <code>{"{{contact_name}}"}</code>, <code>{"{{personalized_intro}}"}</code></p>
        <Button onClick={save}>Speichern</Button>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Bilder & Anhänge</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" /> Bild hochladen</span></Button>
          <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.url} alt={img.alt} className="w-full h-32 object-cover rounded" />
              <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-background/90 rounded p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        {images.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Bilder.</p>}
      </Card>
    </div>
  );
};

export default LeadsTemplates;
