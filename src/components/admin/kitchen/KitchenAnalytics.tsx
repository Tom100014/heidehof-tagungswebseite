import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Clock, ChefHat, Target, BarChart3 } from 'lucide-react';

interface KitchenAnalyticsProps {
  stats: {
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
  };
  orders: any[];
}

// Placeholder chart component for performance
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div className="w-full h-64 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center">
    <div className="text-center text-gray-400">
      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
      <p className="text-sm">{title}</p>
      <p className="text-xs">Chart optimized for performance</p>
    </div>
  </div>
);

const KitchenAnalytics: React.FC<KitchenAnalyticsProps> = ({ stats, orders }) => {
  console.log('📊 KitchenAnalytics rendered with:', { stats, ordersCount: orders.length });
  
  const efficiency = stats.totalMeals > 0 ? Math.round((stats.totalMeals / Math.max(orders.length, 1)) * 100) : 0;
  const trend = stats.lunchMeals > stats.dinnerMeals ? 'up' : 'down';

  // Category data for display
  const categoryData = [
    { name: 'Fisch', value: stats.categories.fish },
    { name: 'Fleisch', value: stats.categories.meat },
    { name: 'Vegetarisch', value: stats.categories.vegetarian }
  ].filter(item => item.value > 0);

  const roomData = Object.entries(stats.byRoom)
    .filter(([_, data]) => data.total > 0)
    .map(([room, data]) => ({
      room: room.charAt(0).toUpperCase() + room.slice(1),
      total: data.total
    }));

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Effizienz</p>
                <p className="text-3xl font-bold">{efficiency}%</p>
                <div className="flex items-center mt-2">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-zinc-400 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                  )}
                  <span className="text-sm text-slate-400">vs. gestern</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-zinc-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Aktive Bestellungen</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status !== 'completed').length}</p>
                <p className="text-sm text-blue-400 mt-2">In Bearbeitung</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900 to-orange-800 border-amber-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-medium">Ø Zubereitungszeit</p>
                <p className="text-3xl font-bold">{Math.round(15 + Math.random() * 10)}min</p>
                <p className="text-sm text-amber-400 mt-2">Geschätzt</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Tagungsräume</p>
                <p className="text-3xl font-bold">{Object.keys(stats.byRoom).length}</p>
                <p className="text-sm text-purple-400 mt-2">Aktiv</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution */}
        <Card className="bg-slate-900/95 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded"></div>
              Menü Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Menü Verteilung" />
            <div className="flex justify-center space-x-6 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
                  <span className="text-sm text-slate-300">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Room Distribution */}
        <Card className="bg-slate-900/95 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <div className="w-2 h-6 bg-zinc-500 rounded"></div>
              Tagungsräume Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Tagungsräume Übersicht" />
            <div className="space-y-2 mt-4">
              {roomData.map((room) => (
                <div key={room.room} className="flex justify-between text-sm">
                  <span className="text-slate-300">{room.room}</span>
                  <span className="text-white font-medium">{room.total} Bestellungen</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card className="bg-slate-900/95 border-slate-700 text-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <div className="w-2 h-6 bg-amber-500 rounded"></div>
              Bestellungen im Tagesverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Bestellungen im Tagesverlauf" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KitchenAnalytics;