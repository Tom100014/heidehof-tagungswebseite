import { OrderItem } from "@/types/order";

export interface ShopOrderData {
  customer_name: string;
  items: OrderItem[];
  delivery_location: string;
  contact_method: string;
  contact_value?: string;
  total_amount: number;
  room_number?: string;
  hotelFooter?: string;
  promotionalFooter?: string;
}

/**
 * Produkthinweise für Lieferservice
 */
function buildProductInstructions(items: OrderItem[]): string {
  const instructions: string[] = [];
  
  items.forEach(item => {
    const itemName = item.name?.toLowerCase() || '';
    
    if (itemName.includes('wellness') || itemName.includes('bademantel')) {
      instructions.push(`\n🧖 *${item.name}:*`);
      instructions.push(`   • Größe prüfen (S/M/L/XL)`);
      instructions.push(`   • Frisch gewaschen und gebügelt`);
      instructions.push(`   • In Folie verpacken`);
    } else if (itemName.includes('handtuch') || itemName.includes('tücher')) {
      instructions.push(`\n🛁 *${item.name}:*`);
      instructions.push(`   • Frisch und sauber`);
      instructions.push(`   • Set komplett: ${item.quantity} Stück`);
    } else if (itemName.includes('kosmetik') || itemName.includes('pflege')) {
      instructions.push(`\n💄 *${item.name}:*`);
      instructions.push(`   • Original verpackt`);
      instructions.push(`   • Haltbarkeit prüfen`);
    } else if (itemName.includes('getränk') || itemName.includes('wasser')) {
      instructions.push(`\n🥤 *${item.name}:*`);
      instructions.push(`   • Gekühlt servieren`);
      instructions.push(`   • Mit Gläsern bereitstellen`);
    }
  });
  
  return instructions.length > 0
    ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *LIEFERHINWEISE FÜR SERVICE*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${instructions.join('\n')}\n\n⚠️ *WICHTIG:* Vollständigkeit und Qualität prüfen!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : '';
}

export class ShopMessageTemplateService {
  
  /**
   * Erstellt eine WhatsApp-Nachricht für Shop Bestellungen (für Gäste)
   * MIT dynamischem Footer aus hotel_settings
   */
  static formatWhatsAppMessage(data: ShopOrderData): string {
    const itemsText = data.items.map(item => 
      `• ${item.quantity}x ${item.name}`
    ).join('\n');

    const baseMessage = `🛍️ *Shop Bestellung*

${data.customer_name} bestellt:
${itemsText}

Lieferung: ${data.delivery_location}
📱 Kontakt:
${data.contact_value}
Gesamt: ${data.total_amount.toFixed(2)} €

🔒 Datenschutz: Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de`;

    // Füge Footer hinzu
    let fullMessage = baseMessage;
    
    if (data.promotionalFooter) {
      fullMessage += `\n\n${data.promotionalFooter}`;
    }
    
    if (data.hotelFooter) {
      fullMessage += `\n\n${data.hotelFooter}`;
    } else {
      fullMessage += `\n\n─────────────────────────────────\nHotel Der Heidehof\nConference & SPA Resort ★★★★Superior\n📞 Telefon: +49 8458 64-0\n🌐 www.der-heidehof.de\n─────────────────────────────────`;
    }
    
    fullMessage += '\n\nVielen Dank!';
    
    return fullMessage;
  }

  /**
   * Erstellt Admin-Nachricht MIT PRODUKTHINWEISEN für Lieferservice
   */
  static formatAdminMessage(data: ShopOrderData): string {
    const itemsText = data.items.map(item => 
      `• ${item.quantity}x ${item.name}`
    ).join('\n');

    const productInstructions = buildProductInstructions(data.items);

    return `🛍️ *Shop Bestellung*

👤 *Kunde:* ${data.customer_name}
${data.room_number ? `🏨 Zimmer: ${data.room_number}` : ''}

📋 *Bestellung:*
${itemsText}

📍 *Lieferung:* ${data.delivery_location}
💰 *Gesamtbetrag:* ${data.total_amount.toFixed(2)} €

📞 *Kontakt:* ${data.contact_value}${productInstructions}`;
  }

  /**
   * Erstellt eine SMS-Nachricht für Shop
   */
  static formatSMSMessage(data: ShopOrderData): string {
    const itemsText = data.items.map(item => 
      `${item.quantity}x ${item.name}`
    ).join(', ');

    return `*** SHOP BESTELLUNG ***

${data.customer_name}
${data.room_number ? `Zimmer: ${data.room_number}` : ''}

ARTIKEL: ${itemsText}
LIEFERUNG: ${data.delivery_location}
GESAMT: ${data.total_amount.toFixed(2)}€

📱 Kontakt:
${data.contact_value}

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de
Hotel Heidehof - Ihr 4-Sterne Superior Erlebnis
🌐 www.der-heidehof.de`;
  }

  /**
   * Erstellt eine Kopiervorlage für Shop
   */
  static formatCopyText(data: ShopOrderData): string {
    const itemsText = data.items.map(item => 
      `   • ${item.quantity}x ${item.name} - ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price || '0.00'}€`
    ).join('\n');

    return `╔══════════════════════════════════════════════════════════╗
║                         SHOP BESTELLUNG                       ║
║                   Hotel Heidehof Ingolstadt                   ║
╚══════════════════════════════════════════════════════════╝

👤 KUNDE: ${data.customer_name}
${data.room_number ? `🏨 Zimmer: ${data.room_number}` : ''}

🛍️  ARTIKEL:
${itemsText}

📍 LIEFERUNG: ${data.delivery_location}
📞 KONTAKT: ${data.contact_value}

💰 GESAMTSUMME: ${data.total_amount.toFixed(2)} €

🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

╔══════════════════════════════════════════════════════════╗
║ STATUS: Neue Bestellung                                       ║
║ Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}                                ║
╚══════════════════════════════════════════════════════════╝`;
  }
}