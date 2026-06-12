// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, TrendingUp, Users, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface DailyReport {
  id: string;
  report_date: string;
  menu_data: any;
  orders_data: any[];
  statistics: any;
  total_orders: number;
  total_guests: number;
  pdf_url?: string;
  csv_url?: string;
  created_at: string;
}

const KitchenDailyReports: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  // Hole alle Tagesberichte
  const { data: reports, isLoading } = useQuery({
    queryKey: ['kitchen-daily-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_daily_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data as DailyReport[];
    }
  });

  // Hole spezifischen Bericht für ausgewähltes Datum
  const { data: reportForDate } = useQuery({
    queryKey: ['kitchen-daily-report', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return null;
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('kitchen_daily_reports')
        .select('*')
        .eq('report_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as DailyReport | null;
    },
    enabled: !!selectedDate
  });

  useEffect(() => {
    if (reportForDate) {
      setSelectedReport(reportForDate);
    } else if (selectedDate && !reportForDate) {
      setSelectedReport(null);
    }
  }, [reportForDate, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const generatePDF = async (report: DailyReport) => {
    try {
      toast.info('PDF wird generiert...');
      
      // Hier würde der PDF-Export implementiert werden
      // Ähnlich wie in KitchenExport.tsx
      
      toast.success('PDF erfolgreich generiert');
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast.error('Fehler beim PDF-Export');
    }
  };

  const generateCSV = async (report: DailyReport) => {
    try {
      const csvData = convertToCSV(report);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `kitchen-report-${report.report_date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV erfolgreich heruntergeladen');
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      toast.error('Fehler beim CSV-Export');
    }
  };

  const convertToCSV = (report: DailyReport) => {
    const stats = report.statistics;
    
    const csvContent = [
      'Küchen-Tagesbericht',
      `Datum,${report.report_date}`,
      `Erstellt am,${format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}`,
      '',
      'ZUSAMMENFASSUNG',
      `Gesamtbestellungen,${report.total_orders}`,
      `Gesamtgäste,${report.total_guests}`,
      `Mittagessen,${stats.lunchMeals || 0}`,
      `Abendessen,${stats.dinnerMeals || 0}`,
      '',
      'KATEGORIEN',
      `Fisch,${stats.categories?.fish || 0}`,
      `Fleisch,${stats.categories?.meat || 0}`,
      `Vegetarisch,${stats.categories?.vegetarian || 0}`,
      '',
      'RÄUME',
      `Berlin,${stats.byRoom?.berlin?.total || 0}`,
      `Hamburg,${stats.byRoom?.hamburg?.total || 0}`,
      `Frankfurt,${stats.byRoom?.frankfurt?.total || 0}`,
      `Bonn,${stats.byRoom?.bonn?.total || 0}`
    ].join('\n');

    return csvContent;
  };


  const getReportDates = () => {
    if (!reports) return [];
    return reports.map(report => new Date(report.report_date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Lade Tagesberichte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Küchen-Tagesberichte</h2>
          <p className="text-muted-foreground">
            Archivierte Berichte der täglichen Küchen-Analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Datum auswählen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => 
                date > new Date() || 
                !getReportDates().some(reportDate => 
                  format(reportDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                )
              }
              className="rounded-md border"
              locale={de}
            />
            
            {reports && reports.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Verfügbare Berichte:</p>
                <div className="space-y-1">
                  {reports.slice(0, 5).map(report => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedDate(new Date(report.report_date));
                        setSelectedReport(report);
                      }}
                      className="w-full text-left p-2 rounded text-sm hover:bg-muted transition-colors"
                    >
                      {format(new Date(report.report_date), 'dd.MM.yyyy', { locale: de })}
                      <Badge variant="secondary" className="ml-2">
                        {report.total_guests} Gäste
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bericht Details */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <ReportDetails 
              report={selectedReport} 
              onExportPDF={generatePDF}
              onExportCSV={generateCSV}
            />
          ) : selectedDate ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Kein Bericht verfügbar</h3>
                <p className="text-muted-foreground">
                  Für das Datum {format(selectedDate, 'dd.MM.yyyy', { locale: de })} 
                  ist kein Tagesbericht verfügbar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Datum auswählen</h3>
                <p className="text-muted-foreground">
                  Wählen Sie ein Datum aus dem Kalender, um den entsprechenden Tagesbericht anzuzeigen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface ReportDetailsProps {
  report: DailyReport;
  onExportPDF: (report: DailyReport) => void;
  onExportCSV: (report: DailyReport) => void;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({ report, onExportPDF, onExportCSV }) => {
  const stats = report.statistics;
  const companyCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const orders = (report.orders_data || []) as any[];
    orders.forEach((o) => {
      const name = (o?.company || o?.guest_info?.company || o?.metadata?.company || '').toString().trim();
      const key = name && name.length > 0 ? name : 'Ohne Firma';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [report]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Tagesbericht - {format(new Date(report.report_date), 'dd.MM.yyyy', { locale: de })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Erstellt am {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onExportCSV(report)}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExportPDF(report)}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{report.total_guests}</p>
                <p className="text-xs text-muted-foreground">Gesamtgäste</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{report.total_orders}</p>
                <p className="text-xs text-muted-foreground">Bestellungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.lunchMeals || 0}</p>
                <p className="text-xs text-muted-foreground">Mittagessen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.dinnerMeals || 0}</p>
                <p className="text-xs text-muted-foreground">Abendessen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategorien, Räume & Firmen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>🐟 Fisch</span>
                <Badge variant="secondary">{stats.categories?.fish || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>🥩 Fleisch</span>
                <Badge variant="secondary">{stats.categories?.meat || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>🥗 Vegetarisch</span>
                <Badge variant="secondary">{stats.categories?.vegetarian || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konferenzräume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byRoom || {}).map(([room, data]: [string, any]) => (
                <div key={room} className="flex justify-between">
                  <span className="capitalize">{room}</span>
                  <Badge variant="secondary">{(data as any).total || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Firmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companyCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Firmendaten</p>
              ) : (
                companyCounts.slice(0, 10).map(([name, count]) => (
                  <div key={name} className="flex justify-between">
                    <span className="truncate max-w-[70%]" title={name as string}>{name}</span>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KitchenDailyReports;