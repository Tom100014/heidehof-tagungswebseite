import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone,
  Settings,
  Volume2,
  Smartphone,
  Clock,
  Star,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggers: string[];
  channels: string[];
  conditions: {
    messageType?: string[];
    priority?: boolean;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  recipients: {
    emails?: string[];
    phones?: string[];
    webhookUrl?: string;
  };
  template: {
    title: string;
    message: string;
  };
}

interface NotificationSettings {
  globalEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  webhookEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  defaultRecipients: {
    emails: string[];
    phones: string[];
  };
}

const AdminNotificationSystem = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    globalEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    webhookEnabled: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    defaultRecipients: {
      emails: [],
      phones: []
    }
  });

  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    name: '',
    enabled: true,
    triggers: [],
    channels: [],
    conditions: {},
    recipients: {},
    template: {
      title: '',
      message: ''
    }
  });
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const { toast } = useToast();

  const messageTypes = [
    { value: 'table_reservation', label: 'Tischreservierung' },
    { value: 'bar_max_order', label: 'Bar Mäx Bestellung' },
    { value: 'bar_max_reservation', label: 'Bar Mäx Reservierung' },
    { value: 'conference_order', label: 'Konferenz Bestellung' },
    { value: 'beauty_appointment', label: 'Beauty Termin' },
    { value: 'complaint', label: 'Beschwerde' },
    { value: 'contact_request', label: 'Kontaktanfrage' },
    { value: 'general_inquiry', label: 'Allgemeine Anfrage' }
  ];

  const triggerTypes = [
    { value: 'new_message', label: 'Neue Nachricht' },
    { value: 'priority_message', label: 'Prioritätsnachricht' },
    { value: 'failed_message', label: 'Fehlgeschlagene Nachricht' },
    { value: 'status_change', label: 'Statusänderung' }
  ];

  const channelTypes = [
    { value: 'email', label: 'E-Mail', icon: Mail },
    { value: 'sms', label: 'SMS', icon: Phone },
    { value: 'push', label: 'Push', icon: Smartphone },
    { value: 'webhook', label: 'Webhook', icon: MessageSquare }
  ];

  useEffect(() => {
    loadSettings();
    loadRules();
    setupRealtimeSubscription();
  }, []);

  const loadSettings = async () => {
    // Using local state only (no database interaction)
    // Settings are initialized in the component state
  };

  const loadRules = async () => {
    // Mock notification rules
    const mockRules: NotificationRule[] = [
      {
        id: '1',
        name: 'Neue Prioritätsnachrichten',
        enabled: true,
        triggers: ['priority_message'],
        channels: ['email', 'sms'],
        conditions: {
          priority: true
        },
        recipients: {
          emails: ['admin@hotel.de'],
          phones: ['+49123456789']
        },
        template: {
          title: 'Prioritätsnachricht: {messageType}',
          message: 'Neue Prioritätsnachricht von {customerName}: {messageContent}'
        }
      }
    ];
    setRules(mockRules);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`admin-messages-notifications-${crypto.randomUUID()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages'
      }, (payload) => {
        handleNewMessage(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewMessage = async (message: any) => {
    if (!settings.globalEnabled) return;

    // Check each rule to see if it should trigger
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const shouldTrigger = checkRuleTrigger(rule, message);
      if (shouldTrigger) {
        await sendNotification(rule, message);
      }
    }
  };

  const checkRuleTrigger = (rule: NotificationRule, message: any): boolean => {
    // Check triggers
    if (rule.triggers.includes('new_message')) return true;
    if (rule.triggers.includes('priority_message') && message.priority) return true;
    if (rule.triggers.includes('failed_message') && message.status === 'failed') return true;

    // Check conditions
    if (rule.conditions.messageType && !rule.conditions.messageType.includes(message.message_type)) {
      return false;
    }

    if (rule.conditions.priority !== undefined && rule.conditions.priority !== message.priority) {
      return false;
    }

    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(settings.quietHours.start.replace(':', ''));
      const endTime = parseInt(settings.quietHours.end.replace(':', ''));
      
      if (startTime > endTime) { // Overnight quiet hours
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      }
    }

    return true;
  };

  const sendNotification = async (rule: NotificationRule, message: any) => {
    const notification = {
      title: rule.template.title.replace('{messageType}', message.message_type)
                                .replace('{customerName}', message.customer_name || 'Unbekannt'),
      message: rule.template.message.replace('{messageContent}', message.message_content)
                                   .replace('{customerName}', message.customer_name || 'Unbekannt')
                                   .replace('{roomNumber}', message.room_number || 'N/A'),
      channels: rule.channels,
      recipients: rule.recipients
    };

    try {
      // Here you would integrate with your actual notification services
      // For now, we'll just show a toast and log
      console.log('Sending notification:', notification);
      
      toast({
        title: "Benachrichtigung gesendet",
        description: `${rule.name} wurde ausgelöst`
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Fehler",
        description: "Benachrichtigung konnte nicht gesendet werden",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    // Settings are saved to local state only
    toast({
      title: "Einstellungen gespeichert",
      description: "Benachrichtigungseinstellungen wurden aktualisiert"
    });
  };

  const saveRule = async () => {
    if (!newRule.name || !newRule.template?.title) {
      toast({
        title: "Fehler",
        description: "Name und Titel sind erforderlich",
        variant: "destructive"
      });
      return;
    }

    // Add rule to local state
    const ruleToAdd = {
      ...newRule,
      id: crypto.randomUUID(),
    } as NotificationRule;

    setRules(prev => [ruleToAdd, ...prev]);
    setNewRule({
      name: '',
      enabled: true,
      triggers: [],
      channels: [],
      conditions: {},
      recipients: {},
      template: {
        title: '',
        message: ''
      }
    });
    setIsCreatingRule(false);

    toast({
      title: "Regel erstellt",
      description: "Neue Benachrichtigungsregel wurde hinzugefügt"
    });
  };

  const deleteRule = async (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: "Regel gelöscht",
      description: "Benachrichtigungsregel wurde entfernt"
    });
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));
    toast({
      title: enabled ? "Regel aktiviert" : "Regel deaktiviert",
      description: `Benachrichtigungsregel wurde ${enabled ? 'aktiviert' : 'deaktiviert'}`
    });
  };

  const addEmail = () => {
    if (newEmail && !settings.defaultRecipients.emails.includes(newEmail)) {
      setSettings(prev => ({
        ...prev,
        defaultRecipients: {
          ...prev.defaultRecipients,
          emails: [...prev.defaultRecipients.emails, newEmail]
        }
      }));
      setNewEmail('');
    }
  };

  const addPhone = () => {
    if (newPhone && !settings.defaultRecipients.phones.includes(newPhone)) {
      setSettings(prev => ({
        ...prev,
        defaultRecipients: {
          ...prev.defaultRecipients,
          phones: [...prev.defaultRecipients.phones, newPhone]
        }
      }));
      setNewPhone('');
    }
  };

  const removeEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      defaultRecipients: {
        ...prev.defaultRecipients,
        emails: prev.defaultRecipients.emails.filter(e => e !== email)
      }
    }));
  };

  const removePhone = (phone: string) => {
    setSettings(prev => ({
      ...prev,
      defaultRecipients: {
        ...prev.defaultRecipients,
        phones: prev.defaultRecipients.phones.filter(p => p !== phone)
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold mb-2">Benachrichtigungssystem</h1>
        <p className="text-muted-foreground">Automatische Benachrichtigungen für neue Nachrichten konfigurieren</p>
      </div>

      {/* Global Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Globale Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Benachrichtigungen aktiviert</h4>
              <p className="text-sm text-muted-foreground">Alle Benachrichtigungen ein-/ausschalten</p>
            </div>
            <Switch
              checked={settings.globalEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, globalEnabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {channelTypes.map(({ value, label, icon: Icon }) => (
              <div key={value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Switch
                  checked={settings[`${value}Enabled` as keyof NotificationSettings] as boolean}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, [`${value}Enabled`]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Ruhezeiten</h4>
                <p className="text-sm text-muted-foreground">Keine Benachrichtigungen in bestimmten Zeiten</p>
              </div>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    quietHours: { ...prev.quietHours, enabled: checked }
                  }))
                }
              />
            </div>

            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start</label>
                  <Input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ende</label>
                  <Input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Recipients */}
          <div className="space-y-4">
            <h4 className="font-medium">Standard-Empfänger</h4>
            
            <div>
              <label className="text-sm font-medium">E-Mail Adressen</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="email"
                  placeholder="admin@heidehof.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button onClick={addEmail} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.defaultRecipients.emails.map((email) => (
                  <Badge key={email} variant="outline" className="pr-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Telefonnummern</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="tel"
                  placeholder="+49 123 456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Button onClick={addPhone} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.defaultRecipients.phones.map((phone) => (
                  <Badge key={phone} variant="outline" className="pr-1">
                    {phone}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removePhone(phone)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={saveSettings} className="w-full">
            Einstellungen speichern
          </Button>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungsregeln
            </CardTitle>
            <Button onClick={() => setIsCreatingRule(true)} disabled={isCreatingRule}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Regel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create New Rule */}
          {isCreatingRule && (
            <Card className="mb-6 border-gold">
              <CardHeader>
                <CardTitle>Neue Benachrichtigungsregel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Regelname</label>
                  <Input
                    placeholder="z.B. Prioritätsnachrichten"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Auslöser</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {triggerTypes.map((trigger) => (
                      <label key={trigger.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newRule.triggers?.includes(trigger.value)}
                          onChange={(e) => {
                            const triggers = newRule.triggers || [];
                            if (e.target.checked) {
                              setNewRule(prev => ({ 
                                ...prev, 
                                triggers: [...triggers, trigger.value] 
                              }));
                            } else {
                              setNewRule(prev => ({ 
                                ...prev, 
                                triggers: triggers.filter(t => t !== trigger.value) 
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{trigger.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Kanäle</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {channelTypes.map((channel) => (
                      <label key={channel.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newRule.channels?.includes(channel.value)}
                          onChange={(e) => {
                            const channels = newRule.channels || [];
                            if (e.target.checked) {
                              setNewRule(prev => ({ 
                                ...prev, 
                                channels: [...channels, channel.value] 
                              }));
                            } else {
                              setNewRule(prev => ({ 
                                ...prev, 
                                channels: channels.filter(c => c !== channel.value) 
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{channel.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Benachrichtigungstitel</label>
                  <Input
                    placeholder="z.B. Neue {messageType} von {customerName}"
                    value={newRule.template?.title}
                    onChange={(e) => setNewRule(prev => ({ 
                      ...prev, 
                      template: { ...prev.template, title: e.target.value } 
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nachrichtenvorlage</label>
                  <Textarea
                    placeholder="z.B. {customerName} hat eine neue Nachricht gesendet: {messageContent}"
                    value={newRule.template?.message}
                    onChange={(e) => setNewRule(prev => ({ 
                      ...prev, 
                      template: { ...prev.template, message: e.target.value } 
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveRule}>
                    <Check className="h-4 w-4 mr-2" />
                    Regel erstellen
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Rules */}
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={rule.enabled ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        {rule.enabled ? (
                          <Badge variant="default">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          <strong>Auslöser:</strong> {rule.triggers.join(', ')}
                        </div>
                        <div>
                          <strong>Kanäle:</strong> {rule.channels.join(', ')}
                        </div>
                        <div>
                          <strong>Titel:</strong> {rule.template.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Regeln konfiguriert</h3>
                <p className="text-muted-foreground">
                  Erstellen Sie Ihre erste Benachrichtigungsregel
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationSystem;
