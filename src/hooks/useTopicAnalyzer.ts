
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TopicAnalysis {
  professional_description: string;
  content_strategy: string;
  target_audience_insights: string;
  recommended_tone: string;
  suggested_word_count: string;
  custom_instructions: string;
  content_angles: string[];
}

interface AnalysisResult {
  success: boolean;
  topic: string;
  keywords: string[];
  analysis: TopicAnalysis;
  market_insights: string;
}

export const useTopicAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeTopic = async (topic: string): Promise<AnalysisResult | null> => {
    if (!topic.trim()) {
      toast.error('Bitte geben Sie ein Thema ein');
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('🎯 Starting AI topic analysis for:', topic);
      
      const { data, error } = await supabase.functions.invoke('analyze-blog-topic', {
        body: { topic: topic.trim() }
      });

      if (error) {
        console.error('❌ Analysis error:', error);
        toast.error('Analyse fehlgeschlagen: ' + error.message);
        return null;
      }

      if (!data?.success) {
        console.error('❌ Analysis failed:', data);
        toast.error('Themen-Analyse fehlgeschlagen');
        return null;
      }

      console.log('✅ AI analysis completed successfully');
      setAnalysisResult(data);
      
      toast.success(`🤖 KI-Analyse abgeschlossen! ${data.keywords.length} Keywords gefunden`);
      
      return data;
    } catch (error) {
      console.error('❌ Topic analysis error:', error);
      toast.error('Unerwarteter Fehler bei der Analyse');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
  };

  return {
    analyzeTopic,
    isAnalyzing,
    analysisResult,
    clearAnalysis
  };
};
