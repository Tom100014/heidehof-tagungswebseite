import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Mail, MessageSquare, Copy, Smartphone } from 'lucide-react';
import { useMessageTemplates, useUpdateTemplate, MessageTemplate } from './hooks/useMessageTemplates';
import TemplateEditor from './TemplateEditor';
import FooterEditor from './FooterEditor';
import { Skeleton } from '@/components/ui/skeleton';

const FORM_TYPE_LABELS: Record<string, string> = {
  conference: 'Konferenz-Bestellungen',
  restaurant: 'Restaurant-Reservierungen',
  beauty: 'Beauty & Wellness',
  bar: 'Bar Mäx Bestellungen',
  complaint: 'Beschwerden & Kontakt',
  shop: 'Shop-Bestellungen',
  general: 'Allgemeine Anfragen',
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4" />,
  sms: <Smartphone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  copy: <Copy className="h-4 w-4" />,
};

const AdminMessageTemplates: React.FC = () => {
  const { data: templates, isLoading } = useMessageTemplates();
  const updateTemplate = useUpdateTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = (updates: Partial<MessageTemplate>) => {
    if (!selectedTemplate) return;
    updateTemplate.mutate({ id: selectedTemplate.id, updates });
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.form_type]) {
      acc[template.form_type] = [];
    }
    acc[template.form_type].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Nachrichten-Templates</h2>
        <p className="text-muted-foreground">
          Verwalten Sie alle Nachrichten-Templates für verschiedene Formulare und Kanäle
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="footer">Hotel-Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-6">
          {groupedTemplates && Object.entries(groupedTemplates).map(([formType, formTemplates]) => (
            <Card key={formType} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">
                  {FORM_TYPE_LABELS[formType] || formType}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formTemplates.length} Template{formTemplates.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {formTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {CHANNEL_ICONS[template.channel]}
                          <span className="font-medium text-sm capitalize">
                            {template.channel}
                          </span>
                        </div>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-sm font-medium line-clamp-2 mb-1">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.content.substring(0, 80)}...
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Bearbeiten
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))}

          {(!groupedTemplates || Object.keys(groupedTemplates).length === 0) && (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Keine Templates vorhanden</p>
                <p className="text-sm">Erstellen Sie Ihr erstes Template</p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="footer" className="mt-6">
          <FooterEditor />
        </TabsContent>
      </Tabs>

      <TemplateEditor
        template={selectedTemplate}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default AdminMessageTemplates;
