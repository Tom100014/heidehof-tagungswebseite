// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStorageItem, setStorageItem } from '@/utils/storageUtils';

interface UseVideoStorageOptions {
  videoKey: string;
  fallbackUrl?: string;
}

/**
 * Improved hook for reliable video storage and retrieval
 * Uses API, Supabase database, and localStorage for maximum persistence
 */
export const useVideoStorage = ({ videoKey, fallbackUrl }: UseVideoStorageOptions) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initial loading with multiple fallback strategies
  useEffect(() => {
    const fetchVideo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading video for key: ${videoKey}, attempt: ${retryCount + 1}`);
        
        // Strategy 1: Try via Edge Function first (robust against network issues)
        try {
          const response = await fetch(`/api/video?key=${videoKey}`);
          const json = await response.json();
          
          if (json.data?.url) {
            console.log(`Video for ${videoKey} loaded from API:`, json.data.url);
            setVideoUrl(json.data.url);
            setStorageItem(videoKey, json.data.url);
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn(`API fetch for ${videoKey} failed, trying database directly:`, apiError);
        }
        
        // Strategy 2: Direct database access
        try {
          const { data, error } = await supabase
            .from('hotel_settings')
            .select('setting_value')
            .eq('setting_key', videoKey)
            .maybeSingle();
          
          if (error) {
            console.error(`Database error for ${videoKey}:`, error);
            throw error;
          }
          
          if (data?.setting_value) {
            // Extract URL based on data format
            const url = typeof data.setting_value === 'object' && data.setting_value !== null && 'url' in data.setting_value
              ? data.setting_value.url as string
              : typeof data.setting_value === 'string'
                ? data.setting_value
                : null;
            
            if (url) {
              console.log(`Video loaded from database: ${url}`);
              setVideoUrl(url);
              // Update localStorage with latest from DB
              setStorageItem(videoKey, url);
              setIsLoading(false);
              return;
            }
          }
        } catch (dbError) {
          console.warn(`Database access for ${videoKey} failed, trying localStorage:`, dbError);
        }
        
        // Strategy 3: Try localStorage (fallback)
        const localUrl = getStorageItem(videoKey);
        if (localUrl) {
          console.log(`Video loaded from localStorage: ${localUrl}`);
          setVideoUrl(localUrl);
          
          // Sync to database for better persistence
          try {
          await supabase
            .from('hotel_settings')
            .upsert({
              setting_key: videoKey,
              setting_value: { url: localUrl, type: 'video' }
            });
            console.log(`Synced localStorage video to database for key: ${videoKey}`);
          } catch (syncError) {
            console.warn(`Failed to sync video to database for key ${videoKey}:`, syncError);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Strategy 4: Use fallback URL if available
        if (fallbackUrl) {
          console.log(`Using fallback video: ${fallbackUrl}`);
          setVideoUrl(fallbackUrl);
        } else {
          console.log(`No video found for key: ${videoKey}`);
          setVideoUrl(null);
        }
      } catch (err) {
        console.error(`Error loading video for ${videoKey}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Retry logic for transient errors
        if (retryCount < 2) {
          console.log(`Will retry loading video for key: ${videoKey}`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideo();
  }, [videoKey, fallbackUrl, retryCount]);
  
  // Function to update video with improved persistence
  const updateVideo = async (url: string | null) => {
    try {
      setIsLoading(true);
      
      if (url) {
        console.log(`Updating video for ${videoKey}: ${url}`);
        
        // Store in database (primary source)
        try {
          await supabase
            .from('hotel_settings')
            .upsert({
              setting_key: videoKey,
              setting_value: { url, type: 'video' }
            });
          console.log(`Database updated for key ${videoKey}`);
        } catch (dbError) {
          console.error(`Failed to update database for key ${videoKey}:`, dbError);
        }
        
        // Store in localStorage (fallback)
        setStorageItem(videoKey, url);
        console.log(`Video updated for ${videoKey}: ${url}`);
      } else {
        // Delete video
        console.log(`Removing video for ${videoKey}`);
        try {
          await supabase
            .from('hotel_settings')
            .delete()
            .eq('setting_key', videoKey);
          console.log(`Removed from database: ${videoKey}`);
        } catch (dbError) {
          console.error(`Failed to remove from database for key ${videoKey}:`, dbError);
        }
        
        localStorage.removeItem(videoKey);
      }
      
      setVideoUrl(url);
    } catch (err) {
      console.error(`Error updating video for ${videoKey}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  return { videoUrl, isLoading, error, updateVideo };
};
