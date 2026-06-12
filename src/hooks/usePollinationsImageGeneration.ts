
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: 'flux' | 'turbo';
  enhance?: boolean;
  nologo?: boolean;
  seed?: number;
}

interface ImageGenerationResult {
  success: boolean;
  image?: string;
  error?: string;
}

export const usePollinationsImageGeneration = () => {
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
          if (prev < 80) return prev + 20;
          return prev;
        });
      }, 300);

      // FIXED: Erweiterte URL-Erstellung mit besserer Fehlerbehandlung 
      const params = new URLSearchParams({
        width: (options.width || 1200).toString(),
        height: (options.height || 630).toString(), 
        model: options.model || 'flux',
        enhance: options.enhance !== false ? 'true' : 'false',
        nologo: options.nologo !== false ? 'true' : 'false',
        seed: (options.seed || Math.floor(Math.random() * 1000000)).toString()
      });

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(options.prompt)}?${params}`;
      
      console.log(`🎨 Generiere Bild für ${requestId}:`, {
        url: imageUrl,
        prompt: options.prompt.substring(0, 100),
        params: Object.fromEntries(params)
      });
      
      clearInterval(progressInterval);
      setProgress(90);

      // Test API availability first
      try {
        const testResponse = await fetch('https://image.pollinations.ai/prompt/test?width=100&height=100&model=flux', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        console.log('✅ Pollinations API reachable');
      } catch (apiError) {
        console.error('❌ Pollinations API nicht erreichbar:', apiError);
        throw new Error('Bildgenerierung Service nicht verfügbar');
      }

      // Teste ob das Bild geladen werden kann
      return new Promise((resolve) => {
        const img = new Image();
        
        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
          console.error(`⏰ Timeout beim Laden des Bildes für ${requestId}`);
          clearInterval(progressInterval);
          resolve({
            success: false,
            error: 'Timeout - Bildgenerierung dauerte zu lange'
          });
        }, 30000);
        
        img.onload = async () => {
          clearTimeout(timeout);
          console.log(`✅ Bild erfolgreich generiert für ${requestId}:`, imageUrl);
          setProgress(100);
          
          if (onSuccess) {
            try {
              await onSuccess(imageUrl);
            } catch (error) {
              console.error('Error in success callback:', error);
            }
          }
          
          resolve({
            success: true,
            image: imageUrl
          });
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          console.error(`❌ Fehler beim Laden des Bildes für ${requestId}`);
          clearInterval(progressInterval);
          resolve({
            success: false,
            error: 'Bild konnte nicht geladen werden - Service möglicherweise nicht verfügbar'
          });
        };
        
        img.src = imageUrl;
      });

    } catch (error) {
      console.error('Fehler bei der Bildgenerierung:', error);
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
