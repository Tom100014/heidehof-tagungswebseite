import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Radar, Sparkles, Zap } from "lucide-react";

interface RadarSearchLoaderProps {
  category: string;
  duration?: number;
}

const searchMessages = [
  "Durchsuche aktuelle Events...",
  "Analysiere lokale Highlights...",
  "Kuratiere Premium-Empfehlungen...",
  "Vervollständige Datensammlung...",
  "Optimiere für Heidehof-Gäste..."
];

export const RadarSearchLoader: React.FC<RadarSearchLoaderProps> = ({ 
  category, 
  duration = 3000 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, duration / 50);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % searchMessages.length);
    }, duration / searchMessages.length);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [duration]);

  return (
    <div className="space-y-6">
      {/* Search Status Card */}
      <Card className="bg-gradient-to-r from-gold/10 to-primary/10 border-gold/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Radar className="w-8 h-8 text-gold animate-spin" />
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-primary animate-pulse" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-foreground">
                  Live-Suche aktiv
                </span>
                <span className="text-xs text-muted-foreground">
                  • {category}
                </span>
              </div>
              
              <p className="text-gold font-medium mb-2">
                {searchMessages[currentMessageIndex]}
              </p>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-gold to-primary h-2 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">AI-Powered</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Skeleton Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card 
            key={idx}
            className="group overflow-hidden border border-border/50 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm"
            style={{ 
              animationDelay: `${idx * 150}ms`,
              animation: `fadeInUp 0.6s ease-out forwards ${idx * 150}ms`
            }}
          >
            <div className="p-4 space-y-4">
              {/* Header with pulse effect */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-gold/20 to-primary/20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16 bg-muted/50" />
                    <Skeleton className="h-4 w-20 bg-muted/50" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="relative">
                    <Skeleton className="h-8 w-8 rounded-full bg-gold/20" />
                    <div className="absolute inset-0 rounded-full bg-gold/30 animate-ping" />
                  </div>
                  <Skeleton className="h-5 w-12 bg-muted/50" />
                </div>
              </div>

              {/* Content with gradient shimmer */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gradient-to-r from-muted/50 via-muted/70 to-muted/50" />
                <Skeleton className="h-4 w-4/5 bg-muted/50" />
                <Skeleton className="h-4 w-3/5 bg-muted/40" />
              </div>
              
              {/* Insider Tip Placeholder */}
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded bg-gold/30" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20 bg-gold/20" />
                    <Skeleton className="h-3 w-full bg-gold/15" />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-muted/40" />
                  <Skeleton className="h-4 w-32 bg-muted/40" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-muted/40" />
                  <Skeleton className="h-4 w-24 bg-muted/40" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="flex-1 h-10 bg-gradient-to-r from-primary/20 to-primary/30" />
                <Skeleton className="h-10 w-10 bg-muted/50" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};