import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  style?: 'photographic' | 'digital_art' | 'cinematic' | 'anime' | 'enhance';
  aspectRatio?: string;
  negativePrompt?: string;
}

interface ImageGenerationResult {
  success: boolean;
  image?: string;
  error?: string;
}

export const useGeminiImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateImage = async (
    requestId: string,
    options: ImageGenerationOptions,
    onSuccess?: (imageUrl: string) => Promise<void>
  ): Promise<ImageGenerationResult> => {
    setIsGenerating(true);
    setGeneratingItemId(requestId);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 80) return prev + 15;
          return prev;
        });
      }, 500);

      console.log(`🎨 Generiere Bild mit Gemini AI für ${requestId}:`, {
        prompt: options.prompt.substring(0, 100),
        style: options.style,
        dimensions: `${options.width || 1200}x${options.height || 630}`
      });
      
      clearInterval(progressInterval);
      setProgress(90);

      // Call Gemini AI image generation edge function
      const { data, error } = await supabase.functions.invoke('generate-gemini-image', {
        body: {
          prompt: options.prompt,
          width: options.width || 1200,
          height: options.height || 630,
          style: options.style || 'photographic',
          aspectRatio: options.aspectRatio || 'landscape',
          negativePrompt: options.negativePrompt
        }
      });

      if (error) {
        console.error(`❌ Gemini AI Fehler für ${requestId}:`, error);
        return {
          success: false,
          error: 'Gemini AI Bildgenerierung fehlgeschlagen'
        };
      }

      if (!data?.success || !data?.imageUrl) {
        console.error(`❌ Keine gültige Antwort von Gemini AI für ${requestId}`);
        return {
          success: false,
          error: 'Ungültige Antwort von Gemini AI'
        };
      }

      const imageUrl = data.imageUrl;
      console.log(`✅ Bild erfolgreich mit Gemini AI generiert für ${requestId}:`, imageUrl);
      setProgress(100);
      
      // Call success callback if provided
      if (onSuccess) {
        try {
          await onSuccess(imageUrl);
        } catch (error) {
          console.error('Error in success callback:', error);
        }
      }
      
      return {
        success: true,
        image: imageUrl
      };

    } catch (error) {
      console.error('❌ Fehler bei der Gemini AI Bildgenerierung:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    } finally {
      setIsGenerating(false);
      setGeneratingItemId(null);
      setProgress(0);
    }
  };

  return {
    generateImage,
    isGenerating,
    generatingItemId,
    progress
  };
};