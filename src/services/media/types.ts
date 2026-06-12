
export type MediaType = "video" | "image" | "document";

export interface UploadOptions {
  /**
   * Callback function for tracking upload progress (0-100)
   */
  onProgress?: (progress: number) => void;
  
  /**
   * Folder path in storage where the file should be saved
   */
  folderPath?: string;
  
  /**
   * Key for saving in hotel_settings table (permanent storage)
   */
  key?: string;
}
