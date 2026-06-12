import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle, TrendingUp, Users, ChefHat } from 'lucide-react';

interface OrdersMetricsProps {
  orders: any[];
  stats: {
    totalMeals: number;
    lunchMeals: number;
    dinnerMeals: number;
    categories: {
      fish: number;
      meat: number;
      vegetarian: number;
    };
  };
}

const OrdersMetrics: React.FC<OrdersMetricsProps> = ({ orders, stats }) => {
  console.log('📊 OrdersMetrics rendered with:', { orders: orders.length, stats });
  
  const pendingOrders = orders.filter(order => 
    order.status === 'new' || order.status === 'pending' || order.status === 'sent'
  ).length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  
  const completionRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;
  const efficiency = stats.totalMeals > 0 ? Math.round((stats.totalMeals / Math.max(orders.length, 1)) * 100) : 0;

  const metrics = [
    {
      title: 'Warteschlange',
      value: pendingOrders,
      subtitle: `${pendingOrders} Neue Bestellungen`,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      trend: `${orders.length} Gesamt heute`
    },
    {
      title: 'In Bearbeitung',
      value: processingOrders,
      subtitle: `${processingOrders} Küche arbeitet`,
      icon: ChefHat,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: `${stats.totalMeals} Mahlzeiten`
    },
    {
      title: 'Abgeschlossen',
      value: completedOrders,
      subtitle: `${completedOrders} Heute fertiggestellt`,
      icon: CheckCircle,
      color: 'bg-zinc-500',
      bgColor: 'bg-zinc-50',
      textColor: 'text-zinc-600',
      trend: `${completionRate}% Erfolgsrate`
    },
    {
      title: 'Mahlzeiten',
      value: stats.totalMeals,
      subtitle: `${stats.lunchMeals} Mittag, ${stats.dinnerMeals} Abend`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      trend: `${efficiency}% Effizienz`
    }
  ];

  const categoryProgress = [
    { 
      name: 'Fisch', 
      value: stats.categories.fish, 
      max: stats.totalMeals, 
      color: 'bg-blue-500',
      percentage: stats.totalMeals > 0 ? (stats.categories.fish / stats.totalMeals) * 100 : 0
    },
    { 
      name: 'Fleisch', 
      value: stats.categories.meat, 
      max: stats.totalMeals, 
      color: 'bg-red-500',
      percentage: stats.totalMeals > 0 ? (stats.categories.meat / stats.totalMeals) * 100 : 0
    },
    { 
      name: 'Vegetarisch', 
      value: stats.categories.vegetarian, 
      max: stats.totalMeals, 
      color: 'bg-zinc-500',
      percentage: stats.totalMeals > 0 ? (stats.categories.vegetarian / stats.totalMeals) * 100 : 0
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.textColor}`} />
                </div>
                <Badge variant="secondary" className="text-xs">Live</Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  {metric.title}
                </h3>
                <p className="text-3xl font-bold text-slate-900">
                  {metric.value}
                </p>
                <p className="text-sm text-slate-500">
                  {metric.subtitle}
                </p>
                <p className="text-xs text-slate-400 mt-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metric.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Progress Bars */}
      <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Menü Kategorien Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryProgress.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{category.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">{category.value} Bestellungen</span>
                  <span className="text-xs text-slate-400">({Math.round(category.percentage)}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${category.color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Real-time Status Board */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-500 to-zinc-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            Echtzeit Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-zinc-400">{stats.categories.fish}</div>
              <div className="text-sm text-slate-300">Fisch Gerichte</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalMeals > 0 ? (stats.categories.fish / stats.totalMeals) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-red-400">{stats.categories.meat}</div>
              <div className="text-sm text-slate-300">Fleisch Gerichte</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalMeals > 0 ? (stats.categories.meat / stats.totalMeals) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-zinc-400">{stats.categories.vegetarian}</div>
              <div className="text-sm text-slate-300">Vegetarisch</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-zinc-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalMeals > 0 ? (stats.categories.vegetarian / stats.totalMeals) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersMetrics;