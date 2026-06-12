
import React from "react";
import { Upload } from "lucide-react";

interface MediaDropZoneProps {
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaDropZone = ({ uploading, onFileChange }: MediaDropZoneProps) => {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">
            Klicken oder hierher ziehen
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Unterstützt Bilder und Videos
          </span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={onFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Maximale Dateigröße: Bilder: 10MB, Videos: 50MB</p>
        <p>Unterstützte Formate: JPG, PNG, GIF, MP4, WEBM</p>
      </div>
    </div>
  );
};

export default MediaDropZone;
