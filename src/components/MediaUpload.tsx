
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MediaUploadService, MediaType } from "@/services/media";
import MediaUploadButton from "@/components/media-upload/MediaUploadButton";
import MediaUploadDialog from "@/components/media-upload/MediaUploadDialog";

interface MediaUploadProps {
  serviceId: string;
  onUploadComplete: (mediaUrl: string, mediaType: "video" | "image") => void;
}

const MediaUpload = ({ serviceId, onUploadComplete }: MediaUploadProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "image" | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Updated file size check to 10MB for images
    if (file.size > 10 * 1024 * 1024) {
      toast(); // No arguments needed
      return;
    }
    
    const fileType: MediaType = file.type.startsWith('video/') ? "video" : "image";
    setMediaType(fileType);
    setMediaFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  };
  
  const handleUpload = async () => {
    if (!mediaFile || !mediaType) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      const publicUrl = await MediaUploadService.uploadMedia(
        mediaFile, 
        mediaType,
        {
          onProgress: setProgress
        }
      );
      
      if (publicUrl) {
        onUploadComplete(publicUrl, mediaType);
        toast(); // No arguments needed
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast(); // No arguments needed
    } finally {
      setUploading(false);
    }
  };
  
  const clearMediaSelection = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setMediaType(null);
    setMediaFile(null);
  };
  
  const handleCloseDialog = () => {
    clearMediaSelection();
    setIsOpen(false);
  };
  
  return (
    <>
      <MediaUploadButton onClick={() => setIsOpen(true)} />
      
      <MediaUploadDialog
        isOpen={isOpen}
        onClose={handleCloseDialog}
        mediaPreview={mediaPreview}
        mediaType={mediaType}
        mediaFile={mediaFile}
        uploading={uploading}
        progress={progress}
        onFileChange={handleFileChange}
        onClearMedia={clearMediaSelection}
        onUpload={handleUpload}
      />
    </>
  );
};

export default MediaUpload;
