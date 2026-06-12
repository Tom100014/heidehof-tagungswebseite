import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MousePointer, Eye, TrendingUp, BarChart3 } from 'lucide-react';

interface UserSessionsPanelProps {
  analytics: any;
}

// Placeholder chart component for performance
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div className="w-full h-48 bg-muted border border-border rounded-lg flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
      <p className="text-sm">{title}</p>
      <p className="text-xs">Chart optimized for performance</p>
    </div>
  </div>
);

const UserSessionsPanel: React.FC<UserSessionsPanelProps> = ({ analytics }) => {
  const [sessionData, setSessionData] = useState<any>({
    totalSessions: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    pageViews: 0,
    topPages: [],
    deviceTypes: [],
    userFlow: []
  });

  useEffect(() => {
    // Mock session data - in real app this would come from analytics service
    const mockData = {
      totalSessions: 1247,
      averageSessionDuration: 185, // seconds
      bounceRate: 32.5, // percentage
      pageViews: 5832,
      topPages: [
        { page: '/welcome', views: 1847, duration: 145 },
        { page: '/admin/dashboard', views: 982, duration: 320 },
        { page: '/restaurant/menu', views: 756, duration: 89 },
        { page: '/services/beauty', views: 623, duration: 112 },
        { page: '/contact', views: 445, duration: 67 }
      ],
      deviceTypes: [
        { name: 'Mobile', value: 65, color: '#8884d8' },
        { name: 'Desktop', value: 28, color: '#82ca9d' },
        { name: 'Tablet', value: 7, color: '#ffc658' }
      ],
      userFlow: [
        { step: 'Landing', users: 100, conversion: 100 },
        { step: 'Services', users: 78, conversion: 78 },
        { step: 'Booking', users: 45, conversion: 58 },
        { step: 'Completion', users: 32, conversion: 71 }
      ]
    };

    setSessionData(mockData);
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getBounceRateStatus = (rate: number) => {
    if (rate < 25) return { color: 'green', status: 'Ausgezeichnet' };
    if (rate < 40) return { color: 'blue', status: 'Gut' };
    if (rate < 60) return { color: 'yellow', status: 'Durchschnitt' };
    return { color: 'red', status: 'Verbesserung nötig' };
  };

  const bounceRateStatus = getBounceRateStatus(sessionData.bounceRate);

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionData.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Letzte 30 Tage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Session Dauer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(sessionData.averageSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Durchschnittliche Verweildauer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionData.bounceRate}%</div>
            <Badge variant={
              bounceRateStatus.color === 'green' ? 'default' :
              bounceRateStatus.color === 'blue' ? 'secondary' :
              bounceRateStatus.color === 'yellow' ? 'outline' : 'destructive'
            }>
              {bounceRateStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionData.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt Seitenaufrufe
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Seiten</CardTitle>
            <CardDescription>
              Meistbesuchte Seiten und Verweildauer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionData.topPages.map((page: any, index: number) => (
                <div key={page.page} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{page.page}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(page.duration)} Durchschnitt
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {page.views.toLocaleString()} Views
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geräte-Verteilung</CardTitle>
            <CardDescription>
              Aufteilung nach Gerätetypen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Geräte-Verteilung" />
            <div className="flex justify-center gap-4 mt-4">
              {sessionData.deviceTypes.map((device: any) => (
                <div key={device.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: device.color }}
                  />
                  <span className="text-sm">{device.name} ({device.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Flow Analyse
          </CardTitle>
          <CardDescription>
            Conversion Funnel der Benutzerreise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartPlaceholder title="User Flow Analyse" />
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {sessionData.userFlow.map((step: any, index: number) => (
              <div key={step.step} className="text-center">
                <div className="font-medium text-sm">{step.step}</div>
                <div className="text-2xl font-bold text-primary">{step.users}</div>
                <div className="text-xs text-muted-foreground">
                  {step.conversion}% Conversion
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSessionsPanel;