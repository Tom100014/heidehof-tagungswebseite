import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import VariablePicker from './VariablePicker';
import TemplatePreview from './TemplatePreview';
import { MessageTemplate } from './hooks/useMessageTemplates';

interface TemplateEditorProps {
  template: MessageTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<MessageTemplate>) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
      setIsActive(template.is_active);
    }
  }, [template]);

  const handleSave = () => {
    if (!template) return;
    
    onSave({
      name,
      content,
      is_active: isActive,
    });
    onClose();
  };

  const handleVariableInsert = (variable: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    setContent(before + variable + after);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Template bearbeiten
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {template.form_type}
            </Badge>
            <Badge variant="outline">{template.channel}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Editor Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template-Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Konferenz Bestätigung WhatsApp"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-content">Nachrichteninhalt</Label>
                <VariablePicker
                  formType={template.form_type}
                  onVariableSelect={handleVariableInsert}
                />
              </div>
              <Textarea
                id="template-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Template-Text mit Mustache-Variablen {{variable}}"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label htmlFor="is-active" className="font-medium">Template aktiv</Label>
                <p className="text-xs text-muted-foreground">
                  Nur aktive Templates werden verwendet
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Preview Column */}
          <div>
            <TemplatePreview
              content={content}
              formType={template.form_type}
              channel={template.channel}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditor;
