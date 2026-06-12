
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import MediaDropZone from "./MediaDropZone";
import MediaPreview from "./MediaPreview";
import UploadProgress from "./UploadProgress";

interface MediaUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaPreview: string | null;
  mediaType: "video" | "image" | null;
  mediaFile: File | null;
  uploading: boolean;
  progress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearMedia: () => void;
  onUpload: () => void;
}

const MediaUploadDialog = ({
  isOpen,
  onClose,
  mediaPreview,
  mediaType,
  mediaFile,
  uploading,
  progress,
  onFileChange,
  onClearMedia,
  onUpload
}: MediaUploadDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Media für Service hochladen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {mediaPreview ? (
            <MediaPreview 
              mediaType={mediaType}
              mediaPreview={mediaPreview}
              mediaFile={mediaFile}
              onRemove={onClearMedia}
              uploading={uploading}
            />
          ) : (
            <MediaDropZone 
              uploading={uploading}
              onFileChange={onFileChange}
            />
          )}
        </div>
        
        <DialogFooter>
          <UploadProgress 
            uploading={uploading}
            progress={progress}
            onUpload={onUpload}
            onCancel={onClose}
            hasMediaFile={!!mediaFile}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadDialog;
