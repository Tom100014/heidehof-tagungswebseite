
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadProgressProps {
  uploading: boolean;
  progress: number;
  onUpload: () => void;
  onCancel: () => void;
  hasMediaFile: boolean;
}

const UploadProgress = ({ 
  uploading, 
  progress, 
  onUpload, 
  onCancel, 
  hasMediaFile 
}: UploadProgressProps) => {
  return (
    <>
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center">
            Upload: {progress}%
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={uploading}
        >
          Abbrechen
        </Button>
        
        <Button 
          onClick={onUpload}
          disabled={!hasMediaFile || uploading}
          className="bg-gold-dark hover:bg-gold-dark/90 text-white"
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
      </div>
    </>
  );
};

export default UploadProgress;
