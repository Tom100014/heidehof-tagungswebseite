// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { 
  Calendar, 
  Clock, 
  Settings,
  ChefHat,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AutomationLog {
  id: string;
  job_type: string;
  execution_date: string;
  execution_time: string;
  status: string;
  details: any;
  error_message?: string;
  created_at: string;
}

const KitchenManagement: React.FC = () => {

  // Hole Automation Logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['kitchen-automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AutomationLog[];
    }
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-zinc-500/20 text-zinc-300 border-zinc-500/30">Erfolgreich</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Fehler</Badge>;
      case 'running':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Läuft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobIcon = (jobType: string) => {
    switch (jobType) {
      case 'daily_archive':
        return <Activity className="h-4 w-4 text-blue-400" />;
      case 'menu_activation':
        return <ChefHat className="h-4 w-4 text-zinc-400" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getJobTitle = (jobType: string) => {
    switch (jobType) {
      case 'daily_archive':
        return 'Tagesarchivierung';
      case 'menu_activation':
        return 'Menü-Aktivierung';
      default:
        return jobType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Lade Management-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Küchen-Management</h2>
        <p className="text-muted-foreground">
          Automatisierung und System-Management für die Küchen-Analytics
        </p>
      </div>

      {/* System Regeln */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automatisierungs-Zeitplan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold">Tagesarchivierung</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Täglich um <span className="font-medium text-foreground">10:31 Uhr</span>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Archiviert Daten von 10:31 Vortag bis 10:30 heute</li>
                <li>• Speichert Statistiken in Tagesberichte</li>
                <li>• Erstellt PDF/CSV-Export</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-4 w-4 text-zinc-500" />
                <h3 className="font-semibold">Menü-Aktivierung</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Täglich um <span className="font-medium text-foreground">12:00 Uhr</span>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Aktiviert neues Tagesmenü im Frontend</li>
                <li>• Generiert AI-Menü falls keines vorhanden</li>
                <li>• Erstellt Küchen-Management-Plan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System-Status & Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getJobIcon(log.job_type)}
                    <div>
                      <p className="font-medium">{getJobTitle(log.job_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(log.status)}
                    {log.error_message && (
                      <div className="text-sm text-red-500" title={log.error_message}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Logs verfügbar</h3>
              <p className="text-muted-foreground">
                Noch keine Automatisierungs-Logs vorhanden.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nächste Ausführungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nächste Ausführungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Tagesarchivierung</p>
                  <p className="text-sm text-muted-foreground">Morgen um 10:31 Uhr</p>
                </div>
              </div>
              <Badge variant="outline">Geplant</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <ChefHat className="h-4 w-4 text-zinc-500" />
                <div>
                  <p className="font-medium">Menü-Aktivierung</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().getHours() < 12 ? 'Heute' : 'Morgen'} um 12:00 Uhr
                  </p>
                </div>
              </div>
              <Badge variant="outline">Geplant</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitchenManagement;