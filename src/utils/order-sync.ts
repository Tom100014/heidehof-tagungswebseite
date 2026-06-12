// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderSyncService {
  syncRestaurantBarOrdersToAdminMessages(): Promise<void>;
  syncBarMaxOrdersToAdminMessages(): Promise<void>;
  syncAllOrdersToAdminMessages(): Promise<void>;
}

class OrderSyncManager implements OrderSyncService {
  
  async syncRestaurantBarOrdersToAdminMessages(): Promise<void> {
    try {
      console.log('🔄 Synchronisiere restaurant_bar_orders zu admin_messages...');
      
      // Alle restaurant_bar_orders holen
      const { data: orders, error: fetchError } = await supabase
        .from('restaurant_bar_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Fehler beim Abrufen der restaurant_bar_orders:', fetchError);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log('📭 Keine restaurant_bar_orders gefunden');
        return;
      }

      console.log(`📊 Gefunden: ${orders.length} restaurant_bar_orders`);

      // Für jede Bestellung prüfen, ob sie bereits in admin_messages existiert
      for (const order of orders) {
        await this.syncSingleOrderToAdminMessages(order);
      }

      console.log('✅ restaurant_bar_orders Synchronisation abgeschlossen');
      
    } catch (error) {
      console.error('💥 Fehler bei restaurant_bar_orders Sync:', error);
    }
  }

  async syncBarMaxOrdersToAdminMessages(): Promise<void> {
    try {
      console.log('🔄 Synchronisiere bar_max_orders zu admin_messages...');
      
      // Alle bar_max_orders holen
      const { data: orders, error: fetchError } = await supabase
        .from('bar_max_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Fehler beim Abrufen der bar_max_orders:', fetchError);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log('📭 Keine bar_max_orders gefunden');
        return;
      }

      console.log(`📊 Gefunden: ${orders.length} bar_max_orders`);

      // Für jede Bestellung prüfen, ob sie bereits in admin_messages existiert
      for (const order of orders) {
        await this.syncSingleBarMaxOrderToAdminMessages(order);
      }

      console.log('✅ bar_max_orders Synchronisation abgeschlossen');
      
    } catch (error) {
      console.error('💥 Fehler bei bar_max_orders Sync:', error);
    }
  }

  async syncAllOrdersToAdminMessages(): Promise<void> {
    console.log('🚀 Starte vollständige Bestellungen-Synchronisation...');
    
    await this.syncRestaurantBarOrdersToAdminMessages();
    await this.syncBarMaxOrdersToAdminMessages();
    
    toast.success('Synchronisation abgeschlossen', {
      description: 'Alle Bestellungen wurden in die Nachrichten-Verwaltung übertragen.'
    });
    
    console.log('🎉 Vollständige Synchronisation abgeschlossen');
  }

  private async syncSingleOrderToAdminMessages(order: any): Promise<void> {
    try {
      // Prüfen ob bereits existiert (basierend auf einer eindeutigen Referenz)
      const orderReference = `${order.order_type.toUpperCase()}-${order.id}`;
      
      const { data: existingMessage } = await supabase
        .from('admin_messages')
        .select('id')
        .eq('order_reference', orderReference)
        .maybeSingle();

      if (existingMessage) {
        console.log(`⏭️ Bestellung ${orderReference} bereits in admin_messages vorhanden`);
        return;
      }

      // Message Content erstellen
      const messageContent = this.formatOrderMessage(order);
      
      // Message Type bestimmen
      const messageType = this.getMessageType(order.order_type);

      // In admin_messages einfügen
      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert({
          message_type: messageType,
          source_form: this.getSourceForm(order.order_type),
          recipient_type: order.send_method || 'whatsapp',
          recipient_contact: order.contact_value || '+4917634177214',
          message_content: messageContent,
          customer_name: order.customer_name,
          room_number: order.room_number,
          order_reference: orderReference,
          metadata: {
            order_type: order.order_type,
            total_amount: order.total_amount,
            items: order.items,
            special_requests: order.special_requests,
            delivery_location: order.delivery_location,
            desired_time: order.desired_time
          },
          status: 'sent',
          sent_at: order.created_at,
          priority: order.priority || false
        });

      if (insertError) {
        console.error(`❌ Fehler beim Einfügen in admin_messages für ${orderReference}:`, insertError);
      } else {
        console.log(`✅ ${orderReference} erfolgreich zu admin_messages hinzugefügt`);
      }

    } catch (error) {
      console.error('💥 Fehler beim Sync einzelner Bestellung:', error);
    }
  }

  private async syncSingleBarMaxOrderToAdminMessages(order: any): Promise<void> {
    try {
      // Prüfen ob bereits existiert
      const orderReference = `BAR-MAX-${order.id}`;
      
      const { data: existingMessage } = await supabase
        .from('admin_messages')
        .select('id')
        .eq('order_reference', orderReference)
        .maybeSingle();

      if (existingMessage) {
        console.log(`⏭️ Bestellung ${orderReference} bereits in admin_messages vorhanden`);
        return;
      }

      // Message Content erstellen
      const messageContent = this.formatBarMaxOrderMessage(order);

      // In admin_messages einfügen
      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert({
          message_type: 'bar_max_order',
          source_form: 'Bar Mäx Bestellung',
          recipient_type: order.send_method || 'whatsapp',
          recipient_contact: order.contact_value || '+4917634177214',
          message_content: messageContent,
          customer_name: order.customer_name,
          room_number: order.room_number || order.table_number,
          order_reference: orderReference,
          metadata: {
            total_amount: order.total_amount,
            items_text: order.items_text,
            special_requests: order.special_requests,
            delivery_location: order.delivery_location,
            desired_time: order.desired_time,
            venue: order.venue
          },
          status: 'sent',
          sent_at: order.created_at,
          priority: order.priority || false
        });

      if (insertError) {
        console.error(`❌ Fehler beim Einfügen in admin_messages für ${orderReference}:`, insertError);
      } else {
        console.log(`✅ ${orderReference} erfolgreich zu admin_messages hinzugefügt`);
      }

    } catch (error) {
      console.error('💥 Fehler beim Sync einzelner Bar Max Bestellung:', error);
    }
  }

  private formatOrderMessage(order: any): string {
    const orderTypeNames = {
      'restaurant_maxwell': 'Restaurant Maxwell',
      'bar_max': 'Bar Mäx',
      'bar_max_snacks': 'Bar Mäx Snacks'
    };

    const orderTypeName = orderTypeNames[order.order_type] || order.order_type;

    return `*🍽️ ${orderTypeName} Bestellung*

👤 *Kunde:* ${order.customer_name}
🏨 *Zimmer:* ${order.room_number || 'N/A'}
📍 *Zustellort:* ${order.delivery_location || 'N/A'}
⏰ *Gewünschte Zeit:* ${order.desired_time || 'Jetzt'}

*📋 Bestellung:*
${order.items_text || 'Keine Details verfügbar'}

*💰 Gesamtbetrag:* ${order.total_amount ? `${order.total_amount}€` : 'N/A'}

${order.special_requests ? `*📝 Sonderwünsche:*\n${order.special_requests}` : ''}

*📞 Kontakt:* ${order.contact_value}

Vielen Dank für Ihre Bestellung!`;
  }

  private formatBarMaxOrderMessage(order: any): string {
    return `*🍸 Bar Mäx Bestellung*

👤 *Kunde:* ${order.customer_name}
🏨 *Zimmer:* ${order.room_number || order.table_number || 'N/A'}
📍 *Zustellort:* ${order.delivery_location || 'N/A'}
⏰ *Gewünschte Zeit:* ${order.desired_time || 'Jetzt'}

*📋 Bestellung:*
${order.items_text || 'Keine Details verfügbar'}

*💰 Gesamtbetrag:* ${order.total_amount ? `${order.total_amount}€` : 'N/A'}

${order.special_requests ? `*📝 Sonderwünsche:*\n${order.special_requests}` : ''}

*📞 Kontakt:* ${order.contact_value}

Vielen Dank für Ihre Bestellung!`;
  }

  private getMessageType(orderType: string): string {
    switch (orderType) {
      case 'restaurant_maxwell':
        return 'restaurant_order';
      case 'bar_max':
      case 'bar_max_snacks':
        return 'bar_max_order';
      default:
        return 'restaurant_order';
    }
  }

  private getSourceForm(orderType: string): string {
    switch (orderType) {
      case 'restaurant_maxwell':
        return 'Restaurant Maxwell Bestellung';
      case 'bar_max':
        return 'Bar Mäx Bestellung';
      case 'bar_max_snacks':
        return 'Bar Mäx Snacks Bestellung';
      default:
        return 'Bestellung';
    }
  }
}

// Export einer Singleton-Instanz
export const orderSyncService = new OrderSyncManager();