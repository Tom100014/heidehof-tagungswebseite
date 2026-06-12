
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PromptInputProps {
  onGenerate: (prompt: string, options: {
    size: string;
    quality: string;
    style: string;
  }) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  defaultPrompt?: string;
  showAdvancedOptions?: boolean;
  className?: string;
  placeholder?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  isGenerating,
  progress,
  defaultPrompt = '',
  showAdvancedOptions = false,
  className = '',
  placeholder = 'Beschreiben Sie das gewünschte Bild...'
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [showOptions, setShowOptions] = useState(false);
  const [imageOptions, setImageOptions] = useState({
    size: "1024x1024",
    quality: "standard",
    style: "natural"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      // Wir fügen Details zum Prompt hinzu, um bessere Ergebnisse zu erzielen
      const enhancedPrompt = prompt.trim() + ". Hochauflösendes, professionelles Foto mit guter Beleuchtung und klaren Details.";
      onGenerate(enhancedPrompt, imageOptions);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            className="pr-24 min-h-[80px] resize-none"
            disabled={isGenerating}
          />
          <Button
            type="submit"
            className="absolute right-2 bottom-2 bg-gold hover:bg-gold-dark"
            size="sm"
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generieren
              </>
            )}
          </Button>
        </div>

        {showAdvancedOptions && (
          <div className="text-right">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
              className="text-xs text-muted-foreground"
            >
              {showOptions ? "Weniger Optionen" : "Erweiterte Optionen"}
            </Button>
          </div>
        )}

        {showAdvancedOptions && showOptions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/10 border rounded-md">
            <div className="space-y-1">
              <label className="text-xs font-medium">Größe</label>
              <Select
                value={imageOptions.size}
                onValueChange={(value) => setImageOptions({...imageOptions, size: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024x1024</SelectItem>
                  <SelectItem value="1024x1792">1024x1792</SelectItem>
                  <SelectItem value="1792x1024">1792x1024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Qualität</label>
              <Select
                value={imageOptions.quality}
                onValueChange={(value) => setImageOptions({...imageOptions, quality: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Stil</label>
              <Select
                value={imageOptions.style}
                onValueChange={(value) => setImageOptions({...imageOptions, style: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natürlich</SelectItem>
                  <SelectItem value="vivid">Lebendig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </form>
      
      {isGenerating && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-center">{progress}%</p>
        </div>
      )}
    </div>
  );
};

export default PromptInput;
