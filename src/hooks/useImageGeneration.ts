import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ImageProvider = 'openai';

export interface ImageGenerationOptions {
  prompt: string;
  provider?: ImageProvider;
  aspect_ratio?: string;
  styling?: string;
  lighting?: string;
  framing?: string;
  size?: string;
  quality?: string;
}

export interface GenerationResult {
  success: boolean;
  image?: string;
  error?: string;
}

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateImage = async (
    itemId: string,
    options: ImageGenerationOptions,
    onSuccess?: (imageUrl: string) => Promise<void>
  ): Promise<GenerationResult> => {
    try {
      setIsGenerating(true);
      setGeneratingItemId(itemId);
      setProgress(10);

      console.log('🎨 Starte DALL-E 3 Bildgenerierung:', {
        itemId,
        prompt: options.prompt.substring(0, 100) + '...',
        size: options.size,
        quality: options.quality
      });

      if (!options.prompt.trim()) {
        throw new Error('Prompt darf nicht leer sein');
      }

      const width = options.size?.includes('x') ? parseInt(options.size.split('x')[0]) : 1024;
      const height = options.size?.includes('x') ? parseInt(options.size.split('x')[1]) : 1024;
      
      setProgress(30);

      // Intelligente Kategorisierung basierend auf Prompt-Inhalt
      let category = 'general';
      const prompt = options.prompt.toLowerCase();
      
      if (prompt.includes('blog') || prompt.includes('artikel') || prompt.includes('header')) {
        category = 'blog';
      } else if (prompt.includes('restaurant') || prompt.includes('speise') || prompt.includes('essen') || prompt.includes('food')) {
        category = 'restaurant';
      } else if (prompt.includes('bar') || prompt.includes('getränk') || prompt.includes('cocktail') || prompt.includes('drink')) {
        category = 'bar';
      } else if (prompt.includes('beauty') || prompt.includes('wellness') || prompt.includes('behandlung') || prompt.includes('spa')) {
        category = 'beauty';
      } else if (prompt.includes('shop') || prompt.includes('produkt') || prompt.includes('product') || prompt.includes('e-commerce')) {
        category = 'shop';
      } else if (prompt.includes('hotel') || prompt.includes('zimmer') || prompt.includes('room') || prompt.includes('hospitality')) {
        category = 'hotel';
      }

      console.log('📂 Erkannte Kategorie:', category);
      setProgress(50);

      // Robuste API-Anfrage mit Retry-Logik
      let attempts = 0;
      const maxAttempts = 3;
      let lastError: any;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🔄 Versuch ${attempts}/${maxAttempts} - Rufe OpenAI Edge Function auf...`);

          const requestBody = {
            prompt: options.prompt,
            width,
            height,
            quality: options.quality || 'standard',
            category
          };

          console.log('📤 Request Body:', requestBody);

          const { data, error } = await supabase.functions.invoke('generate-openai-image', {
            body: requestBody
          });

          console.log('📥 Supabase Response:', { data, error });

          if (error) {
            console.error(`❌ Supabase Function Error (Versuch ${attempts}):`, error);
            lastError = error;
            if (attempts === maxAttempts) {
              throw new Error(`Supabase Function Fehler: ${error.message}`);
            }
            continue;
          }

          if (!data) {
            console.error(`❌ Keine Daten erhalten (Versuch ${attempts})`);
            lastError = new Error('Keine Daten von der Edge Function erhalten');
            if (attempts === maxAttempts) {
              throw lastError;
            }
            continue;
          }

          if (!data.success) {
            console.error(`❌ Edge Function Fehler (Versuch ${attempts}):`, data.error);
            lastError = new Error(data.error || 'Edge Function Fehler');
            if (attempts === maxAttempts) {
              throw lastError;
            }
            continue;
          }

          if (!data.image && !data.imageUrl) {
            console.error(`❌ Keine Bild-URL erhalten (Versuch ${attempts}):`, data);
            lastError = new Error('Keine Bild-URL in der Antwort');
            if (attempts === maxAttempts) {
              throw lastError;
            }
            continue;
          }

          // Erfolg!
          const imageUrl = data.image || data.imageUrl;
          setProgress(90);
          
          console.log('✅ DALL-E 3 Bild erfolgreich generiert:', {
            url: imageUrl,
            model: data.model,
            category: data.category,
            attempts
          });
          
          if (onSuccess) {
            await onSuccess(imageUrl);
          }
          
          setProgress(100);
          return { success: true, image: imageUrl };

        } catch (attemptError) {
          console.error(`❌ Fehler bei Versuch ${attempts}:`, attemptError);
          lastError = attemptError;
          
          if (attempts < maxAttempts) {
            console.log(`⏱️ Warte 2 Sekunden vor nächstem Versuch...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // Alle Versuche fehlgeschlagen
      throw lastError || new Error('Alle Bildgenerierungsversuche fehlgeschlagen');

    } catch (error) {
      console.error('❌ Kritischer Fehler bei der Bildgenerierung:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Bildgenerierung' 
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
    progress,
    currentProvider: 'openai' as ImageProvider,
    setCurrentProvider: () => {}
  };
};