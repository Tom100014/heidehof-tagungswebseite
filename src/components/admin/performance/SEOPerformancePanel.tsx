import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, TrendingUp, Globe, Zap, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface SEOPerformancePanelProps {
  performanceScore: number;
}

const SEOPerformancePanel: React.FC<SEOPerformancePanelProps> = ({ performanceScore }) => {
  const [seoData, setSeoData] = useState<any>({
    lighthouse: {
      performance: performanceScore,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
    },
    coreWebVitals: {
      lcp: { score: 0, status: 'loading' },
      fid: { score: 0, status: 'loading' },
      cls: { score: 0, status: 'loading' }
    },
    rankingFactors: {
      mobileUsability: 0,
      pagespeed: performanceScore,
      https: 100,
      structured: 85
    },
    recommendations: []
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Mock SEO analysis - in real app this would call Google PageSpeed Insights API
    const mockSEOData = {
      lighthouse: {
        performance: performanceScore,
        accessibility: 92,
        bestPractices: 88,
        seo: 95,
      },
      coreWebVitals: {
        lcp: { score: performanceScore > 90 ? 95 : performanceScore > 50 ? 75 : 45, status: 'good' },
        fid: { score: 98, status: 'good' },
        cls: { score: 85, status: 'needs-improvement' }
      },
      rankingFactors: {
        mobileUsability: 96,
        pagespeed: performanceScore,
        https: 100,
        structured: 85
      },
      recommendations: [
        {
          title: 'Bilder optimieren',
          description: 'Komprimieren Sie Bilder und verwenden Sie moderne Formate wie WebP',
          impact: 'high',
          category: 'performance'
        },
        {
          title: 'Unused JavaScript entfernen',
          description: 'Reduzieren Sie Bundle-Größe durch Tree-Shaking',
          impact: 'medium',
          category: 'performance'
        },
        {
          title: 'Alt-Texte vervollständigen',
          description: 'Fügen Sie beschreibende Alt-Texte für alle Bilder hinzu',
          impact: 'medium',
          category: 'accessibility'
        },
        {
          title: 'Structured Data erweitern',
          description: 'Implementieren Sie JSON-LD für Hotels und Dienstleistungen',
          impact: 'high',
          category: 'seo'
        }
      ]
    };

    setSeoData(mockSEOData);
  }, [performanceScore]);

  const runPagespeedAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call to Google PageSpeed Insights
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with fresh data
    setSeoData(prev => ({
      ...prev,
      lighthouse: {
        performance: Math.round(Math.random() * 30 + 70),
        accessibility: Math.round(Math.random() * 20 + 80),
        bestPractices: Math.round(Math.random() * 20 + 75),
        seo: Math.round(Math.random() * 15 + 85),
      }
    }));
    
    setIsAnalyzing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-zinc-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Lighthouse Scores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Lighthouse Performance Audit
              </CardTitle>
              <CardDescription>
                Google Lighthouse Scores für SEO-Ranking
              </CardDescription>
            </div>
            <Button 
              onClick={runPagespeedAnalysis} 
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? 'Analysiere...' : 'Neu Analysieren'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(seoData.lighthouse).map(([key, score]) => (
              <div key={key} className="text-center space-y-2">
                <div className="text-sm font-medium capitalize">
                  {key === 'bestPractices' ? 'Best Practices' : key}
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(score as number)}`}>
                  {score as number}
                </div>
                <Progress value={score as number} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Ranking Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              SEO Ranking Faktoren
            </CardTitle>
            <CardDescription>
              Wichtige Faktoren für Google Rankings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(seoData.rankingFactors).map(([factor, score]) => (
              <div key={factor} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">
                    {factor === 'mobileUsability' ? 'Mobile Usability' :
                     factor === 'pagespeed' ? 'Page Speed' :
                     factor === 'https' ? 'HTTPS Security' :
                     'Structured Data'}
                  </span>
                   <Badge variant={getScoreBadge(score as number)}>
                     {score as number}/100
                   </Badge>
                </div>
                <Progress value={score as number} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Core Web Vitals Status
            </CardTitle>
            <CardDescription>
              Google's User Experience Signale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(seoData.coreWebVitals).map(([vital, data]: [string, any]) => (
              <div key={vital} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium text-sm uppercase">{vital}</div>
                  <div className="text-xs text-muted-foreground">
                    {vital === 'lcp' ? 'Largest Contentful Paint' :
                     vital === 'fid' ? 'First Input Delay' :
                     'Cumulative Layout Shift'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(data.score as number)}`}>
                    {data.score as number}
                  </span>
                  {data.status === 'good' ? (
                    <CheckCircle className="h-4 w-4 text-zinc-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* SEO Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO Optimierungs-Empfehlungen
          </CardTitle>
          <CardDescription>
            Konkrete Schritte zur Verbesserung der Rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {seoData.recommendations.map((rec: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getImpactColor(rec.impact)}>
                      {rec.impact === 'high' ? 'Hohe Priorität' :
                       rec.impact === 'medium' ? 'Mittlere Priorität' : 'Niedrige Priorität'}
                    </Badge>
                    <Badge variant="outline">
                      {rec.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Externe Tools für tiefere Analyse:</p>
                <p className="text-muted-foreground">
                  Nutzen Sie Google Search Console, PageSpeed Insights und GTmetrix für detaillierte SEO-Analysen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOPerformancePanel;