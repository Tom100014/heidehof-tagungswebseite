
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MediaUploadService, MediaType } from "@/services/media";

export interface MediaUploaderProps {
  /**
   * Type of media to upload (image or video)
   */
  mediaType: MediaType;
  
  /**
   * Current media URL if any (for editing)
   */
  currentMediaUrl?: string | null;
  
  /**
   * Callback when media is successfully uploaded
   */
  onUploadComplete: (url: string) => void;
  
  /**
   * Callback when media is removed
   */
  onRemove?: () => void;
  
  /**
   * Storage folder path
   */
  folderPath?: string;
  
  /**
   * Storage key for persistent storage
   */
  storageKey?: string;
  
  /**
   * Custom styling for the uploader container
   */
  className?: string;
  
  /**
   * Button text override
   */
  buttonText?: string;
  
  /**
   * Show the full dialog or compact mode
   */
  variant?: "dialog" | "inline";
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  mediaType,
  currentMediaUrl,
  onUploadComplete,
  onRemove,
  folderPath,
  storageKey,
  className = "",
  buttonText,
  variant = "dialog"
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  
  const maxFileSize = mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  const fileTypeText = mediaType === "video" ? "Video (MP4, MOV, AVI)" : "Bild (JPG, PNG, GIF)";
  const maxSizeText = mediaType === "video" ? "50MB" : "10MB";
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const isCorrectType = mediaType === "video" 
      ? selectedFile.type.startsWith('video/') 
      : selectedFile.type.startsWith('image/');
      
    if (!isCorrectType) {
      toast({
        title: "Fehler",
        description: `Bitte laden Sie ein ${mediaType === "video" ? "Video" : "Bild"} hoch.`,
        variant: "destructive"
      });
      return;
    }
    
    if (selectedFile.size > maxFileSize) {
      toast({
        title: "Fehler",
        description: `Die Datei ist zu groß. Maximum ist ${maxSizeText}.`,
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      
      const isCorrectType = mediaType === "video" 
        ? selectedFile.type.startsWith('video/') 
        : selectedFile.type.startsWith('image/');
        
      if (!isCorrectType) {
        toast({
          title: "Fehler",
          description: `Bitte laden Sie ein ${mediaType === "video" ? "Video" : "Bild"} hoch.`,
          variant: "destructive"
        });
        return;
      }
      
      if (selectedFile.size > maxFileSize) {
        toast({
          title: "Fehler",
          description: `Die Datei ist zu groß. Maximum ist ${maxSizeText}.`,
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      const publicUrl = await MediaUploadService.uploadMedia(
        file,
        mediaType,
        {
          onProgress: setProgress,
          folderPath: folderPath || (mediaType === "video" ? "videos" : "images"),
          key: storageKey
        }
      );
      
      if (!publicUrl) {
        throw new Error(`${mediaType === "video" ? "Video" : "Bild"} Upload fehlgeschlagen`);
      }
      
      // Call the success callback
      onUploadComplete(publicUrl);
      
      // Close dialog if open
      if (variant === "dialog") {
        setIsOpen(false);
      }
      
      toast({
        title: "Erfolgreich",
        description: `Das ${mediaType === "video" ? "Video" : "Bild"} wurde erfolgreich hochgeladen.`
      });
      
      // Reset state
      setFile(null);
      
    } catch (error) {
      console.error(`Error uploading ${mediaType}:`, error);
      toast({
        title: "Fehler beim Upload",
        description: error instanceof Error ? error.message : "Unbekannter Fehler beim Hochladen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemove = async () => {
    if (!currentMediaUrl || !onRemove) return;
    
    try {
      // Remove the media from storage
      const removed = await MediaUploadService.removeMedia(currentMediaUrl);
      
      if (removed) {
        onRemove();
        toast({
          title: "Entfernt",
          description: `Das ${mediaType === "video" ? "Video" : "Bild"} wurde erfolgreich entfernt.`
        });
      }
    } catch (error) {
      console.error(`Error removing ${mediaType}:`, error);
      toast({
        title: "Fehler",
        description: `Das ${mediaType === "video" ? "Video" : "Bild"} konnte nicht entfernt werden.`,
        variant: "destructive"
      });
    }
  };
  
  // Preview component for the uploaded file or current media
  const MediaPreview = () => {
    const url = file ? URL.createObjectURL(file) : currentMediaUrl;
    if (!url) return null;
    
    return (
      <div className="relative rounded-md overflow-hidden border">
        {mediaType === "video" ? (
          <video
            src={url}
            className="w-full h-48 object-cover"
            controls={false}
          />
        ) : (
          <img 
            src={url} 
            alt="Vorschau" 
            className="w-full h-48 object-cover" 
          />
        )}
        
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 rounded-full"
          onClick={file ? () => setFile(null) : handleRemove}
          disabled={uploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  // Compact inline uploader
  if (variant === "inline") {
    return (
      <div className={`space-y-2 ${className}`}>
        {(currentMediaUrl || file) ? (
          <>
            <MediaPreview />
            
            {file && (
              <>
                {uploading && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1" />
                    <p className="text-xs text-center text-muted-foreground">{progress}%</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    Abbrechen
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Hochladen...
                      </>
                    ) : "Hochladen"}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div
            className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById(`file-upload-${mediaType}`)?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{buttonText || `${mediaType === "video" ? "Video" : "Bild"} hochladen`}</p>
            <p className="text-xs text-muted-foreground">{fileTypeText} • Max. {maxSizeText}</p>
            
            <input
              id={`file-upload-${mediaType}`}
              type="file"
              accept={mediaType === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>
    );
  }
  
  // Full dialog uploader
  return (
    <>
      {currentMediaUrl ? (
        <div className="space-y-2">
          <MediaPreview />
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(true)}
            >
              Ersetzen
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={className}
        >
          <Upload className="h-4 w-4 mr-2" />
          {buttonText || `${mediaType === "video" ? "Video" : "Bild"} hochladen`}
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mediaType === "video" ? "Video" : "Bild"} hochladen</DialogTitle>
            <DialogDescription>
              Wählen Sie {mediaType === "video" ? "ein Video" : "ein Bild"} zum Hochladen aus
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {file ? (
              <MediaPreview />
            ) : (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer"
                onClick={() => document.getElementById(`dialog-upload-${mediaType}`)?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Klicken oder hierher ziehen
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileTypeText} • Max. {maxSizeText}
                </p>
                
                <input
                  id={`dialog-upload-${mediaType}`}
                  type="file"
                  accept={mediaType === "video" ? "video/*" : "image/*"}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}
            
            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center">
                  Upload: {progress}%
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Hochladen...
                </>
              ) : (
                'Hochladen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaUploader;
