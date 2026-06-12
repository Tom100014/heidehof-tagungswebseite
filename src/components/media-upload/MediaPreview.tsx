
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Film, Image } from "lucide-react";

interface MediaPreviewProps {
  mediaType: "video" | "image" | null;
  mediaPreview: string;
  mediaFile: File | null;
  onRemove: () => void;
  uploading: boolean;
}

const MediaPreview = ({ mediaType, mediaPreview, mediaFile, onRemove, uploading }: MediaPreviewProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        {mediaType === "video" ? (
          <video 
            src={mediaPreview} 
            className="w-full h-auto rounded" 
            controls
          />
        ) : (
          <img 
            src={mediaPreview} 
            className="w-full h-auto rounded" 
            alt="Preview" 
          />
        )}
        
        <div className="flex justify-between mt-2">
          <div className="flex items-center">
            {mediaType === "video" ? <Film className="h-4 w-4 mr-1" /> : <Image className="h-4 w-4 mr-1" />}
            <span className="text-sm">{mediaFile?.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4 mr-1" />
            Entfernen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPreview;
