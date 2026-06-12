import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, RotateCcw } from 'lucide-react';
import { useHotelFooter, useUpdateHotelFooter } from './hooks/useMessageTemplates';

const DEFAULT_FOOTER = `
---
Hotel Der Heidehof – Conference & SPA Resort
Ingolstädter Straße 121 │ 85080 Gaimersheim / Ingolstadt │ Deutschland
Tel.: +49 8458 64-0 │ Fax: +49 8458 64-230
E-Mail: info@der-heidehof.de │ Web: www.der-heidehof.de`;

const FooterEditor: React.FC = () => {
  const { data: footerData, isLoading } = useHotelFooter();
  const updateFooter = useUpdateHotelFooter();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (footerData) {
      setContent(String(footerData));
    } else {
      setContent(DEFAULT_FOOTER);
    }
  }, [footerData]);

  const handleSave = () => {
    updateFooter.mutate(content);
  };

  const handleReset = () => {
    setContent(DEFAULT_FOOTER);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Hotel-Footer</h3>
            <p className="text-sm text-muted-foreground">
              Wird automatisch an alle ausgehenden Nachrichten angehängt
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={updateFooter.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateFooter.isPending || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-2">
            <Label htmlFor="footer-content">Footer-Text</Label>
            <Textarea
              id="footer-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Hotel-Kontaktdaten..."
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Vorschau</Label>
            <ScrollArea className="h-[200px] rounded-md border bg-muted/30 p-4">
              <div className="whitespace-pre-wrap text-sm font-mono">
                {content}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FooterEditor;
