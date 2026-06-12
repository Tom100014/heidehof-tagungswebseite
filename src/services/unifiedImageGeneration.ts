// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

interface UnifiedImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  quality?: 'high' | 'medium' | 'low';
}

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  provider?: string;
  error?: string;
}

/**
 * Unified Image Generation Service
 * Nutzt die aktiven Provider basierend auf den Einstellungen mit automatischem Fallback
 */
export class UnifiedImageGenerationService {
  
  /**
   * Konvertiert Base64-Bild zu Supabase Storage URL
   */
  private static async uploadBase64ToStorage(base64Data: string, provider: string): Promise<string> {
    try {
      // Entferne data:image prefix falls vorhanden
      const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      const base64Content = base64Match ? base64Match[2] : base64Data;
      const imageType = base64Match ? base64Match[1] : 'png';
      
      // Konvertiere Base64 zu Blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${imageType}` });
      
      // Generiere eindeutigen Dateinamen
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const filename = `${provider}-${timestamp}-${randomId}.${imageType}`;
      
      console.log(`📤 Uploading ${provider} Base64 image to storage: ${filename}`);
      
      // Upload zu Supabase Storage
      const { data, error } = await supabase.storage
        .from('ai-generated-images')
        .upload(filename, blob, {
          contentType: `image/${imageType}`,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('❌ Storage upload failed:', error);
        throw error;
      }
      
      // Hole die öffentliche URL
      const { data: { publicUrl } } = supabase.storage
        .from('ai-generated-images')
        .getPublicUrl(filename);
      
      console.log(`✅ ${provider} Base64 uploaded to: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error(`❌ Error uploading ${provider} Base64:`, error);
      throw error;
    }
  }
  
  /**
   * Lädt die aktiven Provider in der richtigen Reihenfolge
   */
  private static async getActiveProviders(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('image_generation_settings')
        .select('provider')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => p.provider);
    } catch (error) {
      console.error('❌ Fehler beim Laden der aktiven Provider:', error);
      // Fallback auf Standard-Reihenfolge
      return ['gemini', 'lovable', 'pollinations'];
    }
  }

  /**
   * Generiert ein Bild mit Gemini AI (Nano Banana)
   */
  private static async generateWithGemini(options: UnifiedImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Versuche Bildgenerierung mit Gemini AI...');
      
      const { data, error } = await supabase.functions.invoke('generate-gemini-image', {
        body: {
          prompt: options.prompt,
          width: options.width || 1200,
          height: options.height || 630,
          style: 'photographic'
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Gemini AI Fehler');
      }

      let finalImageUrl = data.imageUrl;
      
      // Falls Base64, zu Storage hochladen
      if (finalImageUrl?.startsWith('data:image')) {
        console.log('🔄 Converting Gemini Base64 to Storage URL...');
        finalImageUrl = await this.uploadBase64ToStorage(finalImageUrl, 'gemini');
      }

      console.log('✅ Gemini AI erfolgreich');
      return {
        success: true,
        imageUrl: finalImageUrl,
        provider: 'Gemini AI'
      };
    } catch (error) {
      console.error('❌ Gemini AI fehlgeschlagen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gemini Fehler'
      };
    }
  }

  /**
   * Generiert ein Bild mit Lovable AI
   */
  private static async generateWithLovable(options: UnifiedImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Versuche Bildgenerierung mit Lovable AI...');
      
      const { data, error } = await supabase.functions.invoke('generate-lovable-image', {
        body: {
          prompt: options.prompt,
          width: options.width || 1200,
          height: options.height || 630
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Lovable AI Fehler');
      }

      let finalImageUrl = data.imageUrl;
      
      // Falls Base64, zu Storage hochladen
      if (finalImageUrl?.startsWith('data:image')) {
        console.log('🔄 Converting Lovable Base64 to Storage URL...');
        finalImageUrl = await this.uploadBase64ToStorage(finalImageUrl, 'lovable');
      }

      console.log('✅ Lovable AI erfolgreich');
      return {
        success: true,
        imageUrl: finalImageUrl,
        provider: 'Lovable AI (Nano Banana)'
      };
    } catch (error) {
      console.error('❌ Lovable AI fehlgeschlagen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lovable Fehler'
      };
    }
  }

  /**
   * Generiert ein Bild mit Pollinations AI (kostenlos)
   */
  private static async generateWithPollinations(options: UnifiedImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Versuche Bildgenerierung mit Pollinations AI...');
      
      const randomSeed = Math.floor(Math.random() * 1000000);
      const params = new URLSearchParams({
        width: String(options.width || 1200),
        height: String(options.height || 630),
        model: 'flux',
        enhance: 'true',
        nologo: 'true',
        seed: randomSeed.toString()
      });

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(options.prompt)}?${params}`;

      // Test ob Bild lädt
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
      console.log('✅ Pollinations AI erfolgreich');
          resolve({
            success: true,
            imageUrl,
            provider: 'Pollinations AI'
          });
        };
        img.onerror = () => {
          console.error('❌ Pollinations AI fehlgeschlagen');
          resolve({
            success: false,
            error: 'Pollinations Bildfehler'
          });
        };
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('❌ Pollinations AI fehlgeschlagen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pollinations Fehler'
      };
    }
  }

  /**
   * Hauptmethode: Generiert Bild mit automatischem Fallback
   */
  static async generateImage(options: UnifiedImageGenerationOptions): Promise<ImageGenerationResult> {
    console.log('🎨 Unified Image Generation gestartet:', options.prompt.substring(0, 50));
    
    const activeProviders = await this.getActiveProviders();
    
    if (activeProviders.length === 0) {
      console.error('❌ Keine aktiven Provider gefunden');
      return {
        success: false,
        error: 'Keine aktiven Bildgenerierungs-Provider konfiguriert'
      };
    }

    console.log('📋 Aktive Provider in Reihenfolge:', activeProviders);

    // Versuche jeden Provider in der Reihenfolge
    for (const provider of activeProviders) {
      let result: ImageGenerationResult;

      switch (provider) {
        case 'gemini':
          result = await this.generateWithGemini(options);
          break;
        case 'lovable':
          result = await this.generateWithLovable(options);
          break;
        case 'pollinations':
          result = await this.generateWithPollinations(options);
          break;
        default:
          console.warn(`⚠️ Unbekannter Provider: ${provider}`);
          continue;
      }

      if (result.success) {
        console.log(`✅ Bildgenerierung erfolgreich mit: ${provider}`);
        return result;
      }

      console.log(`⚠️ ${provider} fehlgeschlagen, versuche nächsten Provider...`);
    }

    console.error('❌ Alle Provider fehlgeschlagen');
    return {
      success: false,
      error: 'Alle Bildgenerierungs-Provider fehlgeschlagen'
    };
  }
}
