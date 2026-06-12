import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUpdateTemplate } from './hooks/useMessageTemplates';

interface SimpleTemplateEditorProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
}

const SimpleTemplateEditor: React.FC<SimpleTemplateEditorProps> = ({
  template,
  isOpen,
  onClose
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const updateTemplate = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setContent(template.content || '');
      setIsActive(template.is_active !== false);
    }
  }, [template]);

  const handleSave = () => {
    updateTemplate.mutate(
      {
        id: template.id,
        updates: {
          name,
          content,
          is_active: isActive
        }
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const commonVariables = [
    '{{guestName}}',
    '{{roomNumber}}',
    '{{orderDate}}',
    '{{hotelName}}'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Template bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Konferenz WhatsApp"
              className="text-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-base">Nachricht</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="font-mono"
              placeholder="Ihre Nachricht hier..."
            />
          </div>

          {/* Quick Variables */}
          <div className="space-y-2">
            <Label className="text-base">Variablen einfügen</Label>
            <div className="flex flex-wrap gap-2">
              {commonVariables.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => setContent(content + ' ' + variable)}
                  className="text-xs"
                >
                  {variable}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <Label htmlFor="active" className="text-base">Template aktiv</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateTemplate.isPending}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTemplate.isPending}
            className="bg-gold hover:bg-gold-light text-slate-950 font-semibold"
          >
            {updateTemplate.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleTemplateEditor;
