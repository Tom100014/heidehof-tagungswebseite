// @ts-nocheck

import { supabase } from "@/integrations/supabase/client";

/**
 * Service for handling storage-related operations
 */
export class MediaStorageService {
  /**
   * Gets the public URL for a file in storage
   */
  static getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  }
  
  /**
   * Retrieves media file metadata from the database
   */
  static async getMediaMetadata(publicUrl: string) {
    try {
      // First try to get metadata from our database
      const urlParts = publicUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      let filePath: string | null = null;
      
      // Check if it's a video or image based on common extensions
      if (fileName.match(/\.(mp4|webm|mov|avi)$/i)) {
        filePath = `videos/${fileName}`;
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        filePath = `images/${fileName}`;
      }
      
      if (filePath) {
        const { data, error } = await supabase
          .from('media_files')
          .select('*')
          .eq('file_path', filePath)
          .single();
          
        if (data) {
          return data;
        }
      }
      
      // If not found in database, call the edge function as fallback
      const { data, error } = await supabase.functions.invoke('get-media-metadata', {
        body: { publicUrl }
      });
        
      if (error) {
        console.error("Error fetching media metadata:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Exception fetching media metadata:", error);
      return null;
    }
  }
  
  /**
   * Gets a signed URL for a file in storage (for private files)
   */
  static async getSignedUrl(bucketName: string, filePath: string, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);
        
      if (error) {
        console.error("Error creating signed URL:", error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error("Exception creating signed URL:", error);
      return null;
    }
  }
  
  /**
   * Lists all files in a storage bucket with an optional prefix
   */
  static async listFiles(bucketName: string, prefix?: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(prefix || '');
        
      if (error) {
        console.error("Error listing files:", error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error("Exception listing files:", error);
      return [];
    }
  }
}
