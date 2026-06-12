
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, BarChart3, Database } from 'lucide-react';
import { useCacheStats } from '@/hooks/use-enhanced-cache';
import { enhancedCacheStrategy } from '@/services/cache/enhanced-cache-strategy';
import { toast } from 'sonner';

const CacheMonitor = () => {
  const stats = useCacheStats();

  const handleClearCache = () => {
    enhancedCacheStrategy.clear();
    toast.success('Cache erfolgreich geleert');
  };

  const handleInvalidateMedia = () => {
    enhancedCacheStrategy.invalidateAllMedia();
    toast.success('Medien-Cache invalidiert');
  };

  const getHitRateColor = (hitRate: string) => {
    const rate = parseFloat(hitRate);
    if (rate >= 80) return 'bg-zinc-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <BarChart3 className="h-8 w-8 mb-1 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-secondary">Cache-Monitoring</h2>
          <p className="text-muted-foreground text-sm">
            Überwachung und Verwaltung der Cache-Performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hit Rate</p>
              <p className="text-2xl font-bold">{stats.hitRate}</p>
            </div>
            <Badge className={`${getHitRateColor(stats.hitRate)} text-white`}>
              Performance
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Hits</p>
              <p className="text-2xl font-bold text-zinc-600">{stats.hits}</p>
            </div>
            <div className="text-zinc-600">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Misses</p>
              <p className="text-2xl font-bold text-red-600">{stats.misses}</p>
            </div>
            <div className="text-red-600">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Size</p>
              <p className="text-2xl font-bold">{stats.cacheSize}/{stats.maxSize}</p>
            </div>
            <div className="text-blue-600">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Cache-Statistiken</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground">Gesamte Operationen</label>
            <p className="text-xl font-semibold">{stats.operations}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Evictions</label>
            <p className="text-xl font-semibold">{stats.evictions}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleInvalidateMedia}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Medien-Cache invalidieren
          </Button>
          
          <Button 
            onClick={handleClearCache}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Gesamten Cache leeren
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Cache-Performance-Tipps</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tipp</Badge>
            <p>
              Eine Hit Rate über 80% ist optimal. Bei niedrigeren Werten sollten TTL-Werte angepasst werden.
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tipp</Badge>
            <p>
              Häufige Evictions deuten auf zu kleinen Cache oder zu niedrige TTL-Werte hin.
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Tipp</Badge>
            <p>
              Medien-Cache regelmäßig invalidieren, um aktuelle Bilder sicherzustellen.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CacheMonitor;
