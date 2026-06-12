
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  provider: string;
  status: 'testing' | 'success' | 'error';
  message: string;
  details?: any;
}

const ImageGenerationDiagnostics: React.FC = () => {
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testProvider = async (provider: 'lovable' | 'gemini' | 'pollinations'): Promise<DiagnosticResult> => {
    try {
      const testPrompt = "A beautiful sunset over mountains, test image";
      
      let result;
      
      if (provider === 'lovable') {
        const { data, error } = await supabase.functions.invoke('generate-lovable-image', {
          body: { prompt: testPrompt, width: 512, height: 512, quality: 'standard' }
        });
        
        if (error) throw error;
        result = data;
      } else if (provider === 'gemini') {
        const { data, error } = await supabase.functions.invoke('generate-gemini-image', {
          body: { prompt: testPrompt, width: 512, height: 512 }
        });
        
        if (error) throw error;
        result = data;
      } else if (provider === 'pollinations') {
        const { data, error } = await supabase.functions.invoke('generate-pollinations-image', {
          body: { prompt: testPrompt, width: 512, height: 512 }
        });
        
        if (error) throw error;
        result = data;
      }

      if (result?.success) {
        return {
          provider,
          status: 'success',
          message: 'API funktioniert einwandfrei',
          details: result
        };
      } else {
        return {
          provider,
          status: 'error',
          message: result?.error || 'API Fehler',
          details: result
        };
      }
    } catch (error: any) {
      return {
        provider,
        status: 'error',
        message: `Fehler: ${error.message}`,
        details: error
      };
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const providers: ('lovable' | 'gemini' | 'pollinations')[] = ['lovable', 'gemini', 'pollinations'];
    
    for (const provider of providers) {
      // Set testing status
      setDiagnostics(prev => [...prev, {
        provider,
        status: 'testing',
        message: 'Teste Verbindung...'
      }]);

      const result = await testProvider(provider);
      
      // Update with result
      setDiagnostics(prev => 
        prev.map(d => 
          d.provider === provider ? result : d
        )
      );
    }

    setIsRunning(false);
    
    const finalDiagnostics = diagnostics.filter(d => d.status === 'success');
    const successCount = finalDiagnostics.length;
    
    toast({
      title: "Diagnose abgeschlossen",
      description: `${successCount} von ${providers.length} Provider funktionieren`,
    });
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-zinc-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'testing':
        return <Badge variant="outline">Teste...</Badge>;
      case 'success':
        return <Badge className="bg-zinc-100 text-zinc-800 border-zinc-300">Funktioniert</Badge>;
      case 'error':
        return <Badge variant="destructive">Fehler</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Bildgenerierung Diagnose
        </CardTitle>
        <CardDescription>
          Testen Sie die Verbindung zu den Bildgenerierungs-APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Teste APIs...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Diagnose starten
            </>
          )}
        </Button>

        {diagnostics.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Testergebnisse:</h4>
            {diagnostics.map((result) => (
              <div 
                key={result.provider}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium capitalize">{result.provider} API</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGenerationDiagnostics;
