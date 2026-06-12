// @ts-nocheck

import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { MediaType, UploadOptions } from "./types";

/**
 * Service für Media-Upload-Operationen
 */
export class MediaUploadService {
  /**
   * Validiert Mediendateien nach Typ- und Größenbeschränkungen
   */
  private static validateMediaFile(file: File, mediaType: MediaType): void {
    // Prüfen, ob die Datei den richtigen Typ hat
    if (
      (mediaType === "video" && !file.type.startsWith("video/")) ||
      (mediaType === "image" && !file.type.startsWith("image/")) ||
      (mediaType === "document" && file.type !== "application/pdf")
    ) {
      throw new Error(`Die Datei ist kein ${
        mediaType === "video" ? "Video" : 
        mediaType === "image" ? "Bild" : "PDF-Dokument"
      }`);
    }
    
    // Maximale Dateigröße: 10MB für Bilder und PDFs, 50MB für Videos
    const maxSize = mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Die Datei ist zu groß. Maximum ist ${maxSize / (1024 * 1024)}MB.`);
    }
  }
  
  /**
   * Lädt eine Mediendatei direkt zu Supabase Storage hoch
   */
  static async uploadMedia(
    file: File,
    mediaType: MediaType,
    options: UploadOptions = {}
  ): Promise<string> {
    const { onProgress, folderPath = this.getDefaultFolderPath(mediaType), key } = options;
    
    console.log(`🚀 Starting media upload:`, {
      fileName: file.name,
      size: file.size,
      mediaType,
      folderPath,
      key
    });
    
    // Validiere die Mediendatei
    this.validateMediaFile(file, mediaType);
    
    try {
      // Fortschritts-Tracking einrichten
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      
      if (onProgress) {
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          if (currentProgress < 95) {
            currentProgress += 5;
            onProgress(currentProgress);
          }
        }, 300);
      }

      // Eindeutigen Dateinamen erstellen
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;
      
      console.log(`📁 Upload file path: ${filePath}`);
      
      // In Supabase Storage hochladen
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hotel-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Supabase storage upload error:', uploadError);
        throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
      }

      console.log('✅ File uploaded to storage:', uploadData);

      // Öffentliche URL abrufen
      const { data: { publicUrl } } = supabase.storage
        .from('hotel-media')
        .getPublicUrl(filePath);

      console.log('🌐 Public URL generated:', publicUrl);

      // Metadaten in der Datenbank speichern
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          file_path: filePath,
          file_type: file.type,
          media_type: mediaType,
          size: file.size,
          public_url: publicUrl,
          metadata: { original_name: file.name, key }
        });

      if (dbError) {
        console.error('⚠️ Error saving media metadata:', dbError);
      } else {
        console.log('📝 Media metadata saved to database');
      }

      // Wenn ein Schlüssel angegeben wurde, in hotel_settings speichern
      if (key) {
        console.log(`🔑 Saving to hotel_settings with key: ${key}`);
        
        // Für Admin-Uploads können wir die Session-Prüfung umgehen
        // und direkt in hotel_settings speichern
        const { error: settingsError } = await supabase
          .from('hotel_settings')
          .upsert({
            setting_key: key,
            setting_value: { url: publicUrl, type: mediaType }
          }, {
            onConflict: 'setting_key'
          });
          
        if (settingsError) {
          console.error('⚠️ Error saving to hotel_settings:', {
            error: settingsError,
            key: key
          });
          // Fehler werfen, da das Upload nicht erfolgreich war
          throw new Error(`Fehler beim Speichern der Einstellungen: ${settingsError.message}`);
        } else {
          console.log('✅ Saved to hotel_settings successfully');
        }
      }

      // Progress-Intervall aufräumen
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // 100% Fortschritt melden
      if (onProgress) {
        onProgress(100);
      }

      console.log('🎉 Media upload completed successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error(`💥 Media upload failed for ${mediaType}:`, error);
      throw error;
    }
  }
  
  /**
   * Bestimmt den Standardordner basierend auf dem Medientyp
   */
  private static getDefaultFolderPath(mediaType: MediaType): string {
    switch (mediaType) {
      case "video":
        return "videos";
      case "image":
        return "images";
      case "document":
        return "documents";
      default:
        return "media";
    }
  }
  
  /**
   * Entfernt eine Mediendatei aus Supabase Storage und Datenbank
   */
  static async removeMedia(url: string): Promise<boolean> {
    console.log(`🗑️ Starting media removal for URL: ${url}`);
    
    try {
      // Zuerst versuchen, die Datei in der media_files Tabelle zu finden
      const { data: mediaFile, error: searchError } = await supabase
        .from('media_files')
        .select('file_path, metadata')
        .eq('public_url', url)
        .maybeSingle();
      
      let filePath: string;
      let mediaMetadata: any = null;
      
      if (mediaFile && !searchError) {
        // Datei in der Datenbank gefunden
        filePath = mediaFile.file_path;
        mediaMetadata = mediaFile.metadata;
        console.log(`📋 Found file in database with path: ${filePath}`);
      } else {
        // Fallback: Dateipfad aus URL extrahieren
        console.log('⚠️ File not found in database, extracting path from URL');
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Bestimme Ordner basierend auf Dateierweiterung
        let folderPath = "images"; // Standard
        if (fileName.match(/\.(mp4|webm|mov|avi)$/i)) {
          folderPath = "videos";
        } else if (fileName.match(/\.(pdf)$/i)) {
          folderPath = "documents";
        }
        
        filePath = `${folderPath}/${fileName}`;
        console.log(`🔍 Extracted file path: ${filePath}`);
      }
      
      // Datei aus Storage entfernen
      console.log(`🗄️ Removing file from storage: ${filePath}`);
      const { error: storageError } = await supabase.storage
        .from('hotel-media')
        .remove([filePath]);
        
      if (storageError) {
        console.error("❌ Error removing file from storage:", storageError);
        // Nicht sofort fehlschlagen, da die Datei möglicherweise bereits gelöscht wurde
      } else {
        console.log("✅ File removed from storage successfully");
      }
      
      // Aus der Datenbank media_files entfernen
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('public_url', url);
        
      if (dbError) {
        console.error("⚠️ Error removing media record from database:", dbError);
      } else {
        console.log("📝 Media record removed from database");
      }
      
      // Wenn dieses Medium einen Schlüssel in den Metadaten hat, auch aus hotel_settings entfernen
      if (mediaMetadata && typeof mediaMetadata === 'object' && 'key' in mediaMetadata) {
        const keyValue = mediaMetadata.key;
        const key = typeof keyValue === 'string' ? keyValue : String(keyValue);
        console.log(`🔑 Removing from hotel_settings with key: ${key}`);
        
        const { error: settingsError } = await supabase
          .from('hotel_settings')
          .delete()
          .eq('setting_key', key);
          
        if (settingsError) {
          console.error("⚠️ Error removing from hotel_settings:", settingsError);
        } else {
          console.log("✅ Removed from hotel_settings successfully");
        }
      }
      
      console.log('🎉 Media removal completed successfully');
      return true;
    } catch (error) {
      console.error(`💥 Media removal failed:`, error);
      return false;
    }
  }

  /**
   * Holt die Medien-URL aus der Datenbank anhand des Schlüssels
   */
  static async getMediaUrlByKey(key: string): Promise<string | null> {
    try {
      console.log(`🔍 Getting media URL for key: ${key}`);
      
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .maybeSingle();
        
      if (error) {
        console.error(`❌ Error getting media URL for key ${key}:`, error);
        return null;
      }
      
      if (!data || !data.setting_value) {
        console.log(`📭 No media URL found for key: ${key}`);
        return null;
      }

      const value = data.setting_value;
      
      if (typeof value === 'object' && value !== null && 'url' in value) {
        console.log(`✅ Found media URL for key ${key}:`, value.url);
        return value.url as string;
      } else if (typeof value === 'string') {
        console.log(`✅ Found media URL for key ${key}:`, value);
        return value;
      }
      
      console.log(`⚠️ Invalid media URL format for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`💥 Error getting media URL for key ${key}:`, error);
      return null;
    }
  }
}
