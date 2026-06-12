import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
interface ConferenceOrder {
  id: string;
  guest_info: any;
  lunch_menu: any;
  dinner_menu?: any;
  order_date: string;
  created_at: string;
  status: string;
  send_method?: string;
}
interface KitchenStats {
  totalMeals: number;
  lunchMeals: number;
  dinnerMeals: number;
  categories: {
    fish: number;
    meat: number;
    vegetarian: number;
  };
  byRoom: {
    [roomName: string]: {
      fish: number;
      meat: number;
      vegetarian: number;
      total: number;
    };
  };
}
interface KitchenExportProps {
  orders: ConferenceOrder[];
  stats: KitchenStats;
  selectedDate: string;
}
const KitchenExport: React.FC<KitchenExportProps> = ({
  orders,
  stats,
  selectedDate
}) => {
  const generateCSV = () => {
    // Anonymisierte Statistik als CSV (keine Personennamen)
    const rows: (string | number)[][] = [];
    rows.push(['Datum', selectedDate]);
    rows.push(['Gesamt Mahlzeiten', stats.totalMeals]);
    rows.push(['Mittag', stats.lunchMeals]);
    rows.push(['Abend', stats.dinnerMeals]);
    rows.push(['Fisch', stats.categories.fish]);
    rows.push(['Fleisch', stats.categories.meat]);
    rows.push(['Vegetarisch', stats.categories.vegetarian]);
    rows.push([]);
    rows.push(['Tagungsraum', 'Gesamt', 'Fisch', 'Fleisch', 'Vegetarisch']);
    Object.keys(stats.byRoom).forEach((room) => {
      const r = stats.byRoom[room];
      if (r.total > 0) {
        rows.push([room, r.total, r.fish, r.meat, r.vegetarian]);
      }
    });

    const csvContent = rows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kuechen-schlussbericht-${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV-Statistik exportiert (ohne Namen)');
  };
  const generateKitchenList = () => {
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🍽️ KÜCHEN-SCHLUSSBERICHT - ${selectedDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; background:#0b0b0c; color:#eaeaea; }
        .page { width: 210mm; min-height: 297mm; padding: 14mm; }
        .kpis { display:grid; grid-template-columns: repeat(4,1fr); gap:10px; margin: 10px 0 18px; }
        .kpi { border-radius:10px; padding:12px; text-align:center; border:1px solid #2b2b30; }
        .kpi h3 { margin-bottom:4px; font-size:12px; opacity:.9; }
        .kpi .v { font-size:24px; font-weight:800; }
        .section { border:1px solid #2b2b30; border-radius:12px; padding:14px; margin-bottom:14px; background:#131316; }
        .section h2 { font-size:14px; margin-bottom:10px; opacity:.95; }
        .chips { display:flex; gap:8px; }
        .chip { padding:10px 12px; border-radius:10px; border:1px solid #2b2b30; font-weight:700; font-size:13px; display:flex; justify-content:space-between; gap:12px; min-width:140px; }
        .rooms { display:grid; grid-template-columns:1fr; gap:10px; }
        .room { border:1px solid #2b2b30; border-radius:10px; padding:10px; background:#0f0f13; }
        .room .hd { display:flex; justify-content:space-between; font-weight:700; margin-bottom:8px; }
        .bars { display:flex; gap:8px; }
        .bar { flex:1; height:12px; border-radius:6px; background:#1c1c23; position:relative; overflow:hidden; }
        .bar .in { position:absolute; top:0; left:0; height:100%; }
        .fish .in { background:#1f4bb7; }
        .meat .in { background:#b71b1b; }
        .veg .in { background:#1c8b3c; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
  <div class="page">
    <div class="kpis">
      <div class="kpi"><h3>Total Mahlzeiten</h3><div class="v">${stats.totalMeals}</div></div>
      <div class="kpi"><h3>Mittagessen</h3><div class="v">${stats.lunchMeals}</div></div>
      <div class="kpi"><h3>Abendessen</h3><div class="v">${stats.dinnerMeals}</div></div>
      <div class="kpi"><h3>Bestellungen</h3><div class="v">${orders.length}</div></div>
    </div>

    <div class="section">
      <h2>Menükategorien</h2>
      <div class="chips">
        <div class="chip">Fisch <span>${stats.categories.fish}</span></div>
        <div class="chip">Fleisch <span>${stats.categories.meat}</span></div>
        <div class="chip">Vegetarisch <span>${stats.categories.vegetarian}</span></div>
      </div>
    </div>

    <div class="section">
      <h2>Nach Tagungsräumen</h2>
      <div class="rooms">
        ${Object.keys(stats.byRoom)
          .filter(r => stats.byRoom[r].total > 0)
          .map(r => {
            const room = stats.byRoom[r];
            const total = Math.max(room.total, 1);
            const pf = Math.round((room.fish/total)*100);
            const pm = Math.round((room.meat/total)*100);
            const pv = Math.round((room.vegetarian/total)*100);
            return `
              <div class="room">
                <div class="hd"><span>${r}</span><span>${room.total} Mahlzeiten</span></div>
                <div class="bars">
                  <div class="bar fish"><div class="in" style="width:${pf}%"></div></div>
                  <div class="bar meat"><div class="in" style="width:${pm}%"></div></div>
                  <div class="bar veg"><div class="in" style="width:${pv}%"></div></div>
                </div>
              </div>`;
          }).join('')}
      </div>
    </div>

    <div style="margin-top:14px; font-size:11px; opacity:.7;">Erstellt am ${new Date().toLocaleString('de-DE')}</div>
  </div>
</body>
</html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      toast.success('Küchenliste zum Drucken geöffnet (ohne Namen)');
    }
  };
  const getCategoryClass = (category: string): string => {
    const lowerCategory = category?.toLowerCase() || '';
    if (lowerCategory.includes('fisch') || lowerCategory.includes('fish')) return 'fish';
    if (lowerCategory.includes('fleisch') || lowerCategory.includes('meat')) return 'meat';
    return 'vegetarian';
  };
  const shareDaily = async () => {
    const shareText = `
Küchen-Übersicht ${new Date(selectedDate).toLocaleDateString('de-DE')}

📊 Statistik:
• Gesamt: ${stats.totalMeals} Mahlzeiten
• Mittag: ${stats.lunchMeals} | Abend: ${stats.dinnerMeals}
• Fisch: ${stats.categories.fish} | Fleisch: ${stats.categories.meat} | Vegetarisch: ${stats.categories.vegetarian}

🏢 Nach Tagungsräumen:
${Object.keys(stats.byRoom).filter(room => stats.byRoom[room].total > 0).map(room => `• ${room}: ${stats.byRoom[room].total} Mahlzeiten`).join('\n')}

Generiert: ${new Date().toLocaleString('de-DE')}
    `.trim();
    if (navigator.share) {
      try {
        await navigator.share({ title: `Küchen-Übersicht ${selectedDate}`, text: shareText });
        toast.success('Übersicht geteilt');
      } catch {
        // ignore
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Übersicht in Zwischenablage kopiert');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Farben (seriöses, dünnes Grau-Layout)
    const TEXT = { dark: [20, 20, 22] as [number, number, number], grey: [120, 122, 128] as [number, number, number] };
    const LINE = [205, 207, 210] as [number, number, number];
    const FISH = [31, 75, 183] as [number, number, number];
    const MEAT = [183, 27, 27] as [number, number, number];
    const VEG = [28, 139, 60] as [number, number, number];

    // Header (schwarz, klar)
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Küchen-Schlussbericht', 12, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(new Date(selectedDate).toLocaleDateString('de-DE'), 198, 12, { align: 'right' });

    let y = 28;

    // KPIs (dünne graue Umrandung)
    const kpis = [
      { label: 'Total', value: String(stats.totalMeals) },
      { label: 'Mittag', value: String(stats.lunchMeals) },
      { label: 'Abend', value: String(stats.dinnerMeals) },
      { label: 'Bestellungen', value: String(orders.length) },
    ];
    const boxW = 46, boxH = 16, gap = 6, startX = 12;
    kpis.forEach((k, i) => {
      const x = startX + i * (boxW + gap);
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3);
      doc.roundedRect(x, y, boxW, boxH, 2, 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT.grey);
      doc.text(k.label, x + 4, y + 6);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...TEXT.dark);
      doc.text(k.value, x + 4, y + 12);
    });
    y += boxH + 10;

    // Sektion: Menükategorien
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...TEXT.grey);
    doc.text('Menükategorien', 12, y); y += 5;

    const chips = [
      { name: 'Fisch', value: stats.categories.fish },
      { name: 'Fleisch', value: stats.categories.meat },
      { name: 'Vegetarisch', value: stats.categories.vegetarian },
    ];
    const chipW = 58, chipH = 10;
    chips.forEach((c, i) => {
      const x = 12 + i * (chipW + 6);
      doc.setDrawColor(...LINE); doc.roundedRect(x, y, chipW, chipH, 2, 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT.grey);
      doc.text(`${c.name}:`, x + 4, y + 6.8);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEXT.dark);
      const val = String(c.value);
      doc.text(val, x + chipW - 6, y + 6.8, { align: 'right' });
    });

    y += chipH + 10;

    // Sektion: Räume
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...TEXT.grey);
    doc.text('Nach Tagungsräumen', 12, y); y += 6;

    const rooms = Object.keys(stats.byRoom).filter((r) => stats.byRoom[r].total > 0);
    const barW = 186, barH = 6, barX = 12;

    rooms.forEach((key) => {
      const room = stats.byRoom[key];
      const total = Math.max(room.total, 1);
      const wf = Math.round((room.fish / total) * barW);
      const wm = Math.round((room.meat / total) * barW);
      const wv = Math.max(0, barW - wf - wm); // Rest für vegetarisch

      // Raumtitel
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT.grey);
      doc.text(`${key} (${room.total})`, barX, y);
      y += 2.5;

      // Hintergrundrahmen
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3);
      doc.rect(barX, y, barW, barH);

      // Fisch
      if (wf > 0) { doc.setFillColor(...FISH); doc.rect(barX, y, wf, barH, 'F'); }
      // Fleisch
      if (wm > 0) { doc.setFillColor(...MEAT); doc.rect(barX + wf, y, wm, barH, 'F'); }
      // Vegetarisch
      if (wv > 0) { doc.setFillColor(...VEG); doc.rect(barX + wf + wm, y, wv, barH, 'F'); }

      y += barH + 6;
      if (y > 275) { doc.addPage(); y = 20; }
    });

    // Footer
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...TEXT.grey);
    doc.text(`Erstellt am ${new Date().toLocaleString('de-DE')}`, 12, 292);

    doc.save(`kuechen-schlussbericht-${selectedDate}.pdf`);
    toast.success('PDF exportiert (seriöses Layout, ohne Namen)');
  };
  return <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="bg-slate-50">
        <CardTitle className="flex items-center space-x-2 text-slate-950">
          <Download className="w-5 h-5" />
          <span>Export & Freigabe</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button variant="outline" size="sm" onClick={generateCSV} className="flex items-center space-x-2 text-slate-950">
            <FileText className="w-4 h-4" />
            <span>CSV exportieren</span>
          </Button>

          <Button variant="outline" size="sm" onClick={generateKitchenList} className="flex items-center space-x-2 text-zinc-950">
            <Printer className="w-4 h-4" />
            <span>Druckansicht</span>
          </Button>

          <Button variant="outline" size="sm" onClick={generatePDF} className="flex items-center space-x-2 text-zinc-950">
            <FileText className="w-4 h-4" />
            <span>PDF exportieren</span>
          </Button>

          <Button variant="outline" size="sm" onClick={shareDaily} className="flex items-center space-x-2 text-zinc-950">
            <Share2 className="w-4 h-4" />
            <span>Teilen</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center space-x-2 text-zinc-950">
            <Printer className="w-4 h-4" />
            <span>Seite drucken</span>
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default KitchenExport;