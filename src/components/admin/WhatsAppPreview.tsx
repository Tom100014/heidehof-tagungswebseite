import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WhatsAppPreviewProps {
  title: string;
  message: string;
  className?: string;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ 
  title, 
  message, 
  className = "" 
}) => {
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success("WhatsApp-Nachricht in Zwischenablage kopiert");
  };

  return (
    <Card className={`${className} border-zinc-200 bg-zinc-50/30`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-800">
          <MessageSquare className="w-4 h-4" />
          {title}
          <Badge variant="outline" className="ml-auto text-xs border-zinc-300 text-zinc-700">
            WhatsApp Preview
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* WhatsApp-Style Message Container */}
        <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm">
          <div className="bg-zinc-100 rounded-lg p-3 relative">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {message}
            </pre>
            {/* WhatsApp Message Tail */}
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-zinc-100 transform rotate-45 border-r border-b border-zinc-200"></div>
          </div>
        </div>
        
        {/* Copy Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleCopyMessage}
            variant="outline"
            size="sm"
            className="text-zinc-700 border-zinc-300 hover:bg-zinc-50"
          >
            <Copy className="w-3 h-3 mr-1" />
            Nachricht kopieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};