
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface MediaUploadButtonProps {
  onClick: () => void;
}

const MediaUploadButton = ({ onClick }: MediaUploadButtonProps) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      className="mt-2 w-full"
    >
      <Upload className="h-4 w-4 mr-2" />
      Media hochladen
    </Button>
  );
};

export default MediaUploadButton;
