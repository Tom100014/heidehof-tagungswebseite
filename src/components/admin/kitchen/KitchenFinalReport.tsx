// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChefHat, PrinterIcon, Download, Clock, Users, Utensils, Fish, Beef, Salad, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
interface ConferenceOrder {
  id: string;
  guest_info: any;
  lunch_menu: any;
  dinner_menu?: any;
  order_date: string;
  created_at: string;
  status: string;
  guest_name?: string;
  company?: string;
  conference_room?: string;
}
interface FinalReportStats {
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
      guests: string[];
    };
  };
}
const CONFERENCE_ROOMS = ['Berlin', 'Hamburg', 'Frankfurt', 'Bonn'];
const KitchenFinalReport: React.FC = () => {
  const [orders, setOrders] = useState<ConferenceOrder[]>([]);
  const [stats, setStats] = useState<FinalReportStats>({
    totalMeals: 0,
    lunchMeals: 0,
    dinnerMeals: 0,
    categories: {
      fish: 0,
      meat: 0,
      vegetarian: 0
    },
    byRoom: {}
  });
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);
  useEffect(() => {
    checkDeadlineStatus();
    fetchTodaysOrders();

    // Auto-refresh alle 5 Minuten
    const interval = setInterval(() => {
      checkDeadlineStatus();
      fetchTodaysOrders();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reportDate]);
  const checkDeadlineStatus = () => {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(10, 30, 0, 0);
    setIsAfterDeadline(now > deadline);
  };
  const fetchTodaysOrders = async () => {
    setLoading(true);
    try {
      // Hole alle Bestellungen für heute
      let {
        data,
        error
      } = await supabase.from('conference_orders').select('*').eq('order_date', reportDate).order('created_at', {
        ascending: false
      });

      // Fallback: admin_messages
      if (!data || data.length === 0) {
        const {
          data: adminData,
          error: adminError
        } = await supabase.from('admin_messages').select('*').eq('message_type', 'conference_order').order('created_at', {
          ascending: false
        });
        if (adminData && adminData.length > 0) {
          const convertedOrders = adminData.filter(msg => {
            const metadata = msg.metadata as any || {};
            const menuDate = metadata.menuDate as string;
            return menuDate && menuDate.includes(reportDate.split('-')[2]);
          }).map(msg => {
            const metadata = msg.metadata as any || {};
            return {
              id: msg.id,
              guest_info: {
                guestName: metadata.guestName || msg.customer_name,
                company: metadata.company,
                conferenceRoom: metadata.conferenceRoom,
                guestType: metadata.guestType
              },
              lunch_menu: {
                selection: metadata.lunchSelection,
                category: metadata.lunchSelection
              },
              dinner_menu: metadata.dinnerSelection ? {
                selection: metadata.dinnerSelection,
                category: metadata.dinnerSelection
              } : null,
              order_date: reportDate,
              created_at: msg.created_at,
              status: msg.status || 'new',
              guest_name: metadata.guestName || msg.customer_name,
              company: metadata.company,
              conference_room: metadata.conferenceRoom
            } as ConferenceOrder;
          });
          data = convertedOrders as any;
        }
      }
      if (error && !data) {
        console.error('Fehler beim Laden der Bestellungen:', error);
        toast.error('Fehler beim Laden der Bestellungen');
        return;
      }
      const ordersData = (data || []) as ConferenceOrder[];
      setOrders(ordersData);
      calculateFinalStats(ordersData);
    } catch (error) {
      console.error('Verbindungsfehler:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };
  const calculateFinalStats = (ordersData: ConferenceOrder[]) => {
    const newStats: FinalReportStats = {
      totalMeals: 0,
      lunchMeals: 0,
      dinnerMeals: 0,
      categories: {
        fish: 0,
        meat: 0,
        vegetarian: 0
      },
      byRoom: {}
    };

    // Initialisiere alle Räume
    CONFERENCE_ROOMS.forEach(room => {
      newStats.byRoom[room.toLowerCase()] = {
        fish: 0,
        meat: 0,
        vegetarian: 0,
        total: 0,
        guests: []
      };
    });
    ordersData.forEach(order => {
      const guestInfo = order.guest_info;
      const roomName = (guestInfo?.conferenceRoom || 'unbekannt').toLowerCase();
      const validRoom = CONFERENCE_ROOMS.some(room => room.toLowerCase() === roomName) ? roomName : 'unbekannt';
      if (!newStats.byRoom[validRoom]) {
        newStats.byRoom[validRoom] = {
          fish: 0,
          meat: 0,
          vegetarian: 0,
          total: 0,
          guests: []
        };
      }
      const guestName = guestInfo?.guestName || order.guest_name || 'Unbekannt';
      newStats.byRoom[validRoom].guests.push(guestName);

      // Lunch meals
      if (order.lunch_menu) {
        newStats.lunchMeals++;
        newStats.totalMeals++;
        newStats.byRoom[validRoom].total++;
        const lunchCategory = getCategoryFromSelection(order.lunch_menu.category || order.lunch_menu.selection);
        newStats.categories[lunchCategory]++;
        newStats.byRoom[validRoom][lunchCategory]++;
      }

      // Dinner meals  
      if (order.dinner_menu) {
        newStats.dinnerMeals++;
        newStats.totalMeals++;
        newStats.byRoom[validRoom].total++;
        const dinnerCategory = getCategoryFromSelection(order.dinner_menu.category || order.dinner_menu.selection);
        newStats.categories[dinnerCategory]++;
        newStats.byRoom[validRoom][dinnerCategory]++;
      }
    });
    setStats(newStats);
  };
  const getCategoryFromSelection = (selection: string): 'fish' | 'meat' | 'vegetarian' => {
    if (!selection) return 'vegetarian';
    const lowerSelection = selection.toLowerCase();
    if (lowerSelection.includes('fisch') || lowerSelection.includes('lachs') || lowerSelection.includes('zander')) {
      return 'fish';
    }
    if (lowerSelection.includes('fleisch') || lowerSelection.includes('rind') || lowerSelection.includes('schwein') || lowerSelection.includes('lamm') || lowerSelection.includes('hähnchen') || lowerSelection.includes('huhn')) {
      return 'meat';
    }
    return 'vegetarian';
  };
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fish':
        return <Fish className="w-4 h-4 text-blue-600" />;
      case 'meat':
        return <Beef className="w-4 h-4 text-red-600" />;
      case 'vegetarian':
        return <Salad className="w-4 h-4 text-zinc-600" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };
  const generatePrintableReport = () => {
    const reportContent = `
🍳 KÜCHEN-SCHLUSSBERICHT - ${new Date(reportDate).toLocaleDateString('de-DE')}
=================================================================

⏰ BESTELLSCHLUSS: 10:30 UHR ERREICHT
📊 GESAMTÜBERSICHT:
  • Total Mahlzeiten: ${stats.totalMeals}
  • Mittagessen: ${stats.lunchMeals} 
  • Abendessen: ${stats.dinnerMeals}

🎯 KATEGORIE-AUFSCHLÜSSELUNG:
  🐟 Fisch: ${stats.categories.fish}
  🥩 Fleisch: ${stats.categories.meat}
  🥗 Vegetarisch: ${stats.categories.vegetarian}

🏢 NACH TAGUNGSRÄUMEN:
${Object.entries(stats.byRoom).filter(([_, data]) => data.total > 0).map(([room, data]) => `
  📍 ${room.toUpperCase()}:
    • Total: ${data.total} Mahlzeiten
    • Fisch: ${data.fish} | Fleisch: ${data.meat} | Vegetarisch: ${data.vegetarian}
    • Gäste: ${data.guests.join(', ')}
  `).join('')}

📋 DETAILLIERTE BESTELLUNGEN:
${orders.map((order, index) => `
${index + 1}. ${order.guest_info?.guestName || order.guest_name}
   Firma: ${order.guest_info?.company || order.company || 'N/A'}
   Raum: ${order.guest_info?.conferenceRoom || order.conference_room || 'N/A'}
   Mittag: ${order.lunch_menu?.selection || 'N/A'}
   ${order.dinner_menu ? `Abend: ${order.dinner_menu.selection}` : ''}
`).join('')}

🏨 Hotel Heidehof - Küchenbericht
Erstellt: ${new Date().toLocaleString('de-DE')}
`;
    navigator.clipboard.writeText(reportContent);
    toast.success('Schlussbericht in Zwischenablage kopiert!');
  };
  const printReport = () => {
    window.print();
  };
  const exportCSV = () => {
    const header = ['Gast', 'Firma', 'Raum', 'Mittag', 'Abend'];
    const rows = orders.map(o => [o.guest_info?.guestName || o.guest_name || '', o.guest_info?.company || o.company || '', o.guest_info?.conferenceRoom || o.conference_room || '', o.lunch_menu?.selection || '', o.dinner_menu?.selection || '']);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '\"')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kueche-schlussbericht-${reportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text(`Küchen-Schlussbericht – ${new Date(reportDate).toLocaleDateString('de-DE')}`, 10, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total: ${stats.totalMeals} | Mittag: ${stats.lunchMeals} | Abend: ${stats.dinnerMeals}`, 10, y);
    y += 6;
    doc.text(`Fisch: ${stats.categories.fish} | Fleisch: ${stats.categories.meat} | Veggie: ${stats.categories.vegetarian}`, 10, y);
    y += 8;
    doc.setFontSize(12);
    doc.text('Bestellungen', 10, y);
    y += 6;
    doc.setFontSize(10);
    orders.forEach((o, idx) => {
      const line1 = `${idx + 1}. ${o.guest_info?.guestName || o.guest_name} – ${o.guest_info?.company || o.company || 'N/A'} – Raum: ${o.guest_info?.conferenceRoom || o.conference_room || 'N/A'}`;
      const line2 = `Mittag: ${o.lunch_menu?.selection || 'N/A'}${o.dinner_menu ? ` | Abend: ${o.dinner_menu.selection}` : ''}`;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(line1, 10, y);
      y += 6;
      doc.text(line2, 10, y);
      y += 8;
    });
    doc.save(`kueche-schlussbericht-${reportDate}.pdf`);
  };
  return <div className="space-y-6 print:bg-white print:text-black">
      {/* Header mit Status */}
      <Card className="border-2 border-dashed border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isAfterDeadline ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ChefHat className="w-7 h-7 text-amber-600" />
                Küchen-Schlussbericht
              </CardTitle>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={isAfterDeadline ? "destructive" : "secondary"} className="text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {isAfterDeadline ? 'BESTELLSCHLUSS ERREICHT' : 'BIS 10:30 UHR'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {new Date(reportDate).toLocaleDateString('de-DE')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMeals}</div>
                <div className="text-sm text-blue-500">Total Mahlzeiten</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-zinc-600">{stats.lunchMeals}</div>
                <div className="text-sm text-zinc-500">Mittagessen</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.dinnerMeals}</div>
                <div className="text-sm text-purple-500">Abendessen</div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{orders.length}</div>
                <div className="text-sm text-orange-500">Bestellungen</div>
              </CardContent>
            </Card>
          </div>

          {/* Kategorie-Übersicht */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Menükategorien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon('fish')}
                    <span className="font-medium">Fisch</span>
                  </div>
                  <Badge variant="secondary">{stats.categories.fish}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon('meat')}
                    <span className="font-medium">Fleisch</span>
                  </div>
                  <Badge variant="secondary">{stats.categories.meat}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon('vegetarian')}
                    <span className="font-medium">Vegetarisch</span>
                  </div>
                  <Badge variant="secondary">{stats.categories.vegetarian}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tagungsräume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Nach Tagungsräumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byRoom).filter(([_, data]) => data.total > 0).map(([room, data]) => <div key={room} className="p-4 border rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg capitalize">{room}</h4>
                        <Badge variant="outline">{data.total} Mahlzeiten</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-sm text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                          🐟 {data.fish}
                        </div>
                        <div className="text-sm text-center p-2 bg-red-50 dark:bg-red-950/30 rounded">
                          🥩 {data.meat}
                        </div>
                        <div className="text-sm text-center p-2 bg-zinc-50 dark:bg-zinc-950/30 rounded">
                          🥗 {data.vegetarian}
                        </div>
                      </div>
                      
                      
                    </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
            
            
            
            
          </div>

          {/* Status Message */}
          <div className={`flex items-center gap-2 p-4 rounded-lg ${isAfterDeadline ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'}`}>
            {isAfterDeadline ? <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Bestellschluss um 10:30 Uhr erreicht. Alle Bestellungen erfasst.</span>
              </> : <>
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Noch bis 10:30 Uhr können Bestellungen eingehen.</span>
              </>}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default KitchenFinalReport;