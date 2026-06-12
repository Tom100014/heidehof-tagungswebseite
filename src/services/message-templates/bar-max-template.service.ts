import { OrderItem } from "@/types/order";

export interface BarMaxOrderData {
  customer_name: string;
  room_number?: string;
  table_number?: string;
  contact_method: string;
  contact_value?: string;
  delivery_location: string;
  desired_time: string;
  items: OrderItem[];
  total_amount: number;
  special_requests?: string;
  venue: string;
  hotelFooter?: string;
  promotionalFooter?: string;
}

/**
 * Cocktail-Rezepturen und Zubereitungshinweise
 */
const COCKTAIL_RECIPES: { [key: string]: string } = {
  'mojito': '🍹 MOJITO REZEPTUR:\n   • 50ml weißer Rum\n   • 30ml frischer Limettensaft\n   • 2 TL brauner Zucker\n   • 6-8 frische Minzblätter\n   • Sodawasser\n   • Crushed Ice\n   ANRICHTUNG: Minze im Glas andrücken, Zucker und Lime hinzu, mit Eis füllen, Rum dazu, mit Soda auffüllen',
  'aperol spritz': '🍹 APEROL SPRITZ REZEPTUR:\n   • 60ml Prosecco\n   • 40ml Aperol\n   • Splash Sodawasser\n   • Orangenscheibe + Eiswürfel\n   ANRICHTUNG: Weinglas mit Eis füllen, Aperol, Prosecco, Soda - Orange als Garnitur',
  'martini': '🍸 MARTINI REZEPTUR:\n   • 60ml Gin (oder Vodka)\n   • 10ml trockener Vermouth\n   • Olive oder Zitronenzeste\n   • Eiswürfel\n   ANRICHTUNG: Martini-Glas vorkühlen, Zutaten im Shaker rühren (nicht schütteln!), abseihen, mit Olive garnieren',
  'gin tonic': '🍸 GIN TONIC REZEPTUR:\n   • 50ml Premium Gin\n   • 150ml Tonic Water\n   • Zitronenscheibe + Wacholderbeeren\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Gin hinzu, sanft mit Tonic auffüllen, Zitrone garnieren',
  'caipirinha': '🍹 CAIPIRINHA REZEPTUR:\n   • 60ml Cachaça\n   • 1 Limette (geviertelt)\n   • 2 TL brauner Zucker\n   • Crushed Ice\n   ANRICHTUNG: Limetten im Glas muddeln, Zucker dazu, mit Eis auffüllen, Cachaça hinzu, umrühren',
  'margarita': '🍹 MARGARITA REZEPTUR:\n   • 50ml Tequila\n   • 25ml Cointreau\n   • 25ml frischer Limettensaft\n   • Salzrand + Eiswürfel\n   ANRICHTUNG: Glasrand mit Limette befeuchten, in Salz tauchen, alle Zutaten mit Eis shaken, abseihen',
  
  // Mix-Getränke (alle mit gleicher Rezeptur-Detail wie Cocktails)
  'vodka lemon': '🍸 VODKA LEMON REZEPTUR:\n   • 40ml Vodka\n   • 120ml Zitronenlimonade\n   • Zitronenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Vodka hinzu, mit Zitronenlimonade auffüllen, Zitrone als Garnitur',
  'vodka orange': '🍸 VODKA ORANGE REZEPTUR:\n   • 40ml Vodka\n   • 120ml frischer Orangensaft\n   • Orangenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Vodka und Orangensaft hinzu, umrühren, Orange als Garnitur',
  'rum cola': '🍹 RUM COLA REZEPTUR:\n   • 40ml Rum (weiß oder braun)\n   • 120ml Cola\n   • Limettenschnitz\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Rum hinzu, mit Cola auffüllen, Limette ausdrücken und hinzufügen',
  'whiskey cola': '🥃 WHISKEY COLA REZEPTUR:\n   • 40ml Whiskey\n   • 120ml Cola\n   • Optional: Zitronenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Tumbler mit Eis füllen, Whiskey hinzu, mit Cola auffüllen, optional Zitrone garnieren',
  'campari orange': '🍊 CAMPARI ORANGE REZEPTUR:\n   • 40ml Campari\n   • 120ml frischer Orangensaft\n   • Orangenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Tumbler mit Eis füllen, Campari und Orangensaft hinzu, umrühren, Orange garnieren',
  'bacardi cola': '🍹 BACARDI COLA REZEPTUR:\n   • 40ml Bacardi Rum\n   • 120ml Cola\n   • Limettenschnitz\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Bacardi hinzu, mit Cola auffüllen, Limette ausdrücken',
  'vodka cranberry': '🍸 VODKA CRANBERRY REZEPTUR:\n   • 40ml Vodka\n   • 120ml Cranberrysaft\n   • Limettenschnitz\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Vodka und Cranberrysaft hinzu, mit Limette garnieren',
  'gin lemon': '🍸 GIN LEMON REZEPTUR:\n   • 40ml Gin\n   • 120ml Zitronenlimonade\n   • Zitronenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Gin hinzu, mit Zitronenlimonade auffüllen, Zitrone garnieren',
  'moscow mule': '🍹 MOSCOW MULE REZEPTUR:\n   • 50ml Vodka\n   • 15ml frischer Limettensaft\n   • 120ml Ginger Beer\n   • Limettenscheibe + Minze\n   • Eiswürfel\n   ANRICHTUNG: Kupferbecher (oder Highball) mit Eis füllen, Vodka und Limettensaft hinzu, mit Ginger Beer auffüllen, mit Limette und Minze garnieren',
  'jägermeister orange': '🥃 JÄGERMEISTER ORANGE REZEPTUR:\n   • 40ml Jägermeister\n   • 120ml Orangensaft\n   • Orangenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Tumbler mit Eis füllen, Jägermeister und Orangensaft hinzu, umrühren, Orange garnieren',
  'vodka energy': '⚡ VODKA ENERGY REZEPTUR:\n   • 40ml Vodka\n   • 120ml Energy Drink\n   • Limettenschnitz\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Vodka hinzu, mit Energy Drink auffüllen, Limette hinzufügen',
  'rum orange': '🍹 RUM ORANGE REZEPTUR:\n   • 40ml Rum\n   • 120ml frischer Orangensaft\n   • Orangenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Rum und Orangensaft hinzu, Orange als Garnitur',
  'gin orange': '🍸 GIN ORANGE REZEPTUR:\n   • 40ml Gin\n   • 120ml frischer Orangensaft\n   • Orangenscheibe\n   • Eiswürfel\n   ANRICHTUNG: Highball-Glas mit Eis füllen, Gin und Orangensaft hinzu, Orange garnieren'
};

/**
 * Baut erweiterte Servierhinweise für Speisen und Getränke MIT Rezepturen
 */
function buildServingInstructionsDetailed(items: OrderItem[]): string {
  const instructions: string[] = [];
  
  items.forEach(item => {
    const itemName = item.name?.toLowerCase() || '';
    
    // Prüfe auf Cocktail-Rezepturen
    let hasRecipe = false;
    for (const [cocktailKey, recipe] of Object.entries(COCKTAIL_RECIPES)) {
      if (itemName.includes(cocktailKey)) {
        instructions.push(`\n${recipe}`);
        hasRecipe = true;
        break;
      }
    }
    
    // Falls kein spezifisches Rezept, nutze generische Hinweise
    if (!hasRecipe) {
      // Getränke-spezifische Hinweise
      if (itemName.includes('cocktail') || itemName.includes('longdrink')) {
        instructions.push(`\n🍹 *${item.name}:*`);
        instructions.push(`   • Mit frischen Kräutern garnieren`);
        instructions.push(`   • Eisgekühlt servieren (Shaker verwenden)`);
        instructions.push(`   • Highball-Glas oder Cocktailglas`);
        instructions.push(`   • Strohhalm und Rührer bereitstellen`);
      } else if (itemName.includes('wein') || itemName.includes('champagner') || itemName.includes('sekt')) {
        instructions.push(`\n🍷 *${item.name}:*`);
        instructions.push(`   • Kühltemperatur: Weißwein 8-10°C, Rotwein 16-18°C`);
        instructions.push(`   • Passendes Weinglas verwenden`);
        instructions.push(`   • Bei Bedarf dekantieren (Rotwein)`);
      } else if (itemName.includes('bier')) {
        instructions.push(`\n🍺 *${item.name}:*`);
        instructions.push(`   • Kühltemperatur: 6-8°C`);
        instructions.push(`   • Im Marken-Glas servieren`);
        instructions.push(`   • Mit 2 Finger Schaum einschenken`);
      } else if (itemName.includes('kaffee') || itemName.includes('espresso')) {
        instructions.push(`\n☕ *${item.name}:*`);
        instructions.push(`   • Frisch zubereitet bei 92-96°C`);
        instructions.push(`   • Mit Milch/Zucker auf der Seite`);
        instructions.push(`   • In vorgewärmter Tasse servieren`);
      }
      
      // Speisen-spezifische Hinweise
      if (itemName.includes('pizza') || itemName.includes('flammkuchen')) {
        instructions.push(`\n🍕 *${item.name}:*`);
        instructions.push(`   • Heiß servieren (185-200°C aus dem Ofen)`);
        instructions.push(`   • Vorgeschnitten in 8 Stücke`);
        instructions.push(`   • Auf Holzbrett oder großem Teller`);
        instructions.push(`   • Parmesan, Chili-Öl, Oregano bereitstellen`);
      } else if (itemName.includes('burger') || itemName.includes('sandwich')) {
        instructions.push(`\n🍔 *${item.name}:*`);
        instructions.push(`   • Warm servieren (Patty medium: 60-65°C)`);
        instructions.push(`   • Pommes Frites als Beilage (knusprig!)`);
        instructions.push(`   • Coleslaw oder Salat dazu`);
        instructions.push(`   • Ketchup, Mayo, Senf bereitstellen`);
        instructions.push(`   • Servietten nicht vergessen`);
      } else if (itemName.includes('salat')) {
        instructions.push(`\n🥗 *${item.name}:*`);
        instructions.push(`   • Frisch und gekühlt servieren (5-7°C)`);
        instructions.push(`   • Dressing separat in kleiner Karaffe`);
        instructions.push(`   • Optional: Brot oder Baguette dazu`);
      } else if (itemName.includes('pasta') || itemName.includes('nudeln')) {
        instructions.push(`\n🍝 *${item.name}:*`);
        instructions.push(`   • Al dente zubereiten (8-10 Min)`);
        instructions.push(`   • Heiß servieren (75-80°C)`);
        instructions.push(`   • Parmesan und Pfeffer anbieten`);
        instructions.push(`   • Mit Basilikum garnieren`);
      } else if (itemName.includes('suppe')) {
        instructions.push(`\n🍲 *${item.name}:*`);
        instructions.push(`   • Heiß servieren (85-90°C)`);
        instructions.push(`   • In vorgewärmter Suppentasse`);
        instructions.push(`   • Brot oder Croutons dazu`);
      } else if (itemName.includes('dessert') || itemName.includes('kuchen') || itemName.includes('torte')) {
        instructions.push(`\n🍰 *${item.name}:*`);
        instructions.push(`   • Gekühlt servieren (falls Sahne)`);
        instructions.push(`   • Dekorativ anrichten`);
        instructions.push(`   • Optional: Sahne oder Eis als Beilage`);
      } else if (itemName.includes('chips') || itemName.includes('nüsse') || itemName.includes('snack')) {
        instructions.push(`\n🥜 *${item.name}:*`);
        instructions.push(`   • In Schale oder auf Teller servieren`);
        instructions.push(`   • Bei Raumtemperatur genießen`);
        instructions.push(`   • Optional: Dips bereitstellen`);
      }
    }
  });
  
  return instructions.length > 0 
    ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 *SERVIERHINWEISE & REZEPTUREN*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${instructions.join('\n')}\n\n⚠️ *WICHTIG:* Qualitätskontrolle vor Auslieferung!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` 
    : '';
}

/**
 * Baut einfache Servierhinweise (für Gäste-Nachrichten)
 */
function buildServingInstructions(items: OrderItem[]): string {
  const instructions: string[] = [];
  
  items.forEach(item => {
    const itemName = item.name?.toLowerCase() || '';
    
    // Nur wichtigste Hinweise für Gäste
    if (itemName.includes('pizza') || itemName.includes('flammkuchen')) {
      instructions.push(`\n🍕 *${item.name}:* Heiß serviert`);
    } else if (itemName.includes('burger')) {
      instructions.push(`\n🍔 *${item.name}:* Mit Beilagen`);
    } else if (itemName.includes('cocktail')) {
      instructions.push(`\n🍹 *${item.name}:* Eisgekühlt`);
    }
  });
  
  return instructions.length > 0 
    ? `\n\n📋 *Servierhinweise:*${instructions.join('\n')}` 
    : '';
}

export class BarMaxMessageTemplateService {
  
  /**
   * Erstellt eine luxuriöse WhatsApp-Nachricht für Bar Mäx Bestellungen
   * MIT dynamischem Footer aus hotel_settings
   */
  static formatWhatsAppMessage(data: BarMaxOrderData): string {
    const itemsText = data.items.map(item => 
      `• ${item.quantity}x ${item.name} (${typeof item.price === 'number' ? item.price.toFixed(2) : item.price || '0.00'}€)`
    ).join('\n');

    const locationText = data.room_number 
      ? `*Hotelgast* (Zimmer ${data.room_number})` 
      : `*Spa-Gast* (Schlüssel ${data.table_number || 'unbekannt'})`;

    // Calculate subtotal and room service fee
    const subtotal = data.items.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + (price * item.quantity);
    }, 0);
    
    const isRoomService = data.delivery_location === 'Zimmer' && data.room_number;
    const roomServiceFee = isRoomService ? 5.00 : 0;

    const priceBreakdown = isRoomService ? 
      `💰 *Preisaufstellung:*
📦 Zwischensumme: ${subtotal.toFixed(2)} €
🏨 Zimmerservice: ${roomServiceFee.toFixed(2)} €
💰 *Gesamtbetrag: ${data.total_amount.toFixed(2)} €*` : 
      `💰 *Gesamtbetrag:* ${data.total_amount.toFixed(2)} €`;

    // Always show room service info, but make it clear when it applies
    const roomServiceNotice = isRoomService ? 
      `ℹ️ *Hinweis:* Zimmerservice-Gebühr von 5,00€ wurde zur Bestellung hinzugefügt (Lieferung ins Zimmer)` :
      `ℹ️ *Hinweis:* Bei Lieferung ins Zimmer fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an`;

    // Servierhinweise für Admin
    const servingInstructions = buildServingInstructions(data.items);
    
    // Basis-Nachricht (für Gäste)
    const baseMessage = `🍺 *${data.venue || 'Bar Mäx'} Bestellung*

Guten Tag, ich bin ${data.customer_name} und bestelle hiermit:

${itemsText}

👤 *Gastinformationen:*
${locationText}

🚚 *Lieferung an:*
${data.delivery_location}
⏰ *Wunschzeit:* ${data.desired_time}

📞 *Kontakt:*
${data.contact_value || 'Keine Angabe'}

${priceBreakdown}

${data.special_requests ? `⚠️ *Allergien/Sonderwünsche:*
${data.special_requests}

` : ''}${roomServiceNotice}

🔒 *Datenschutz:* Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de`;

    // Füge Footer hinzu (nur wenn vorhanden)
    let fullMessage = baseMessage;
    
    if (data.promotionalFooter) {
      fullMessage += `\n\n${data.promotionalFooter}`;
    }
    
    if (data.hotelFooter) {
      fullMessage += `\n\n${data.hotelFooter}`;
    } else {
      // Fallback Footer
      fullMessage += `\n\n─────────────────────────────────\nHotel Der Heidehof\nConference & SPA Resort ★★★★Superior\n📞 Telefon: +49 8458 64-0\n🌐 www.der-heidehof.de\n─────────────────────────────────`;
    }
    
    fullMessage += '\n\nVielen Dank!';
    
    return fullMessage;
  }

  /**
   * Erstellt Admin-Nachricht MIT ERWEITERTEN Servierhinweisen und Rezepturen
   */
  static formatAdminMessage(data: BarMaxOrderData): string {
    const itemsText = data.items.map(item => 
      `• ${item.quantity}x ${item.name} (${typeof item.price === 'number' ? item.price.toFixed(2) : item.price || '0.00'}€)`
    ).join('\n');

    const locationText = data.room_number 
      ? `*Hotelgast* (Zimmer ${data.room_number})` 
      : `*Spa-Gast* (Schlüssel ${data.table_number || 'unbekannt'})`;

    const subtotal = data.items.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + (price * item.quantity);
    }, 0);
    
    const isRoomService = data.delivery_location === 'Zimmer' && data.room_number;
    const roomServiceFee = isRoomService ? 5.00 : 0;

    const priceBreakdown = isRoomService ? 
      `💰 *Preisaufstellung:*
📦 Zwischensumme: ${subtotal.toFixed(2)} €
🏨 Zimmerservice: ${roomServiceFee.toFixed(2)} €
💰 *Gesamtbetrag: ${data.total_amount.toFixed(2)} €*` : 
      `💰 *Gesamtbetrag:* ${data.total_amount.toFixed(2)} €`;

    // Verwende ERWEITERTE Servierhinweise mit Rezepturen
    const servingInstructions = buildServingInstructionsDetailed(data.items);

    return `🍺 *${data.venue || 'Bar Mäx'} Bestellung*

👤 *Kunde:* ${data.customer_name}
${locationText}

📋 *Bestellung:*
${itemsText}

🚚 *Lieferung an:*
${data.delivery_location}${data.room_number ? ` - Zimmer ${data.room_number}` : ''}
⏰ *Gewünschte Zeit:* ${data.desired_time}

${priceBreakdown}

${data.special_requests ? `⚠️ *Allergien/Sonderwünsche:*
${data.special_requests}

` : ''}📞 *Kontakt:* ${data.contact_value || 'Keine Angabe'}${servingInstructions}`;
  }

  /**
   * Erstellt eine elegante SMS-Nachricht für Bar Mäx
   */
  static formatSMSMessage(data: BarMaxOrderData): string {
    const itemsText = data.items.map(item => 
      `${item.quantity}x ${item.name}`
    ).join(', ');

    // Calculate subtotal and room service fee
    const subtotal = data.items.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + (price * item.quantity);
    }, 0);
    
    const isRoomService = data.delivery_location === 'Zimmer' && data.room_number;
    const roomServiceFee = isRoomService ? 5.00 : 0;

    const priceInfo = isRoomService ? 
      `ZWISCHENSUMME: ${subtotal.toFixed(2)}€
ZIMMERSERVICE: ${roomServiceFee.toFixed(2)}€
GESAMT: ${data.total_amount.toFixed(2)}€` : 
      `GESAMT: ${data.total_amount.toFixed(2)}€`;

    // Always show room service info
    const roomServiceInfo = isRoomService ? 
      `ZIMMERSERVICE: 5,00€ wurde hinzugefügt (Lieferung ins Zimmer)` :
      `HINWEIS: Bei Lieferung ins Zimmer fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an`;

    return `*** BAR MÄX BESTELLUNG ***

${data.customer_name}
${data.room_number ? `Zimmer: ${data.room_number}` : `Spa-Schlüssel: ${data.table_number}`}

BESTELLUNG: ${itemsText}
LIEFERUNG: ${data.delivery_location}
ZEIT: ${data.desired_time}
${priceInfo}

${roomServiceInfo}

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de
Hotel Heidehof - Ihr 4-Sterne Superior Erlebnis
🌐 www.der-heidehof.de
Kontakt: ${data.contact_value}`;
  }

  /**
   * Erstellt eine Kopiervorlage für Bar Mäx
   */
  static formatCopyText(data: BarMaxOrderData): string {
    // Calculate subtotal and room service fee
    const subtotal = data.items.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + (price * item.quantity);
    }, 0);
    
    const isRoomService = data.delivery_location === 'Zimmer' && data.room_number;
    const roomServiceFee = isRoomService ? 5.00 : 0;

    const priceSection = isRoomService ? 
      `💰 PREISAUFSTELLUNG:
   📦 Zwischensumme: ${subtotal.toFixed(2)} €
   🏨 Zimmerservice: ${roomServiceFee.toFixed(2)} €
   ═══════════════════════════════════
   💰 GESAMTSUMME: ${data.total_amount.toFixed(2)} €` : 
      `💰 GESAMTSUMME: ${data.total_amount.toFixed(2)} €`;

    // Always show room service info
    const roomServiceNotice = isRoomService ? 
      `ℹ️  ZIMMERSERVICE: 5,00€ wurde zur Bestellung hinzugefügt (Lieferung ins Zimmer)` :
      `ℹ️  HINWEIS: Bei Lieferung ins Zimmer fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an`;

    return `╔══════════════════════════════════════════════════════════╗
║                        BAR MÄX BESTELLUNG                      ║
║                   Hotel Heidehof Ingolstadt                   ║
╚══════════════════════════════════════════════════════════╝

👤 GAST: ${data.customer_name}
🏨 ${data.room_number ? `Zimmer: ${data.room_number}` : `Spa-Schlüssel: ${data.table_number}`}

🍺 BESTELLUNG:
${data.items.map(item => 
      `   • ${item.quantity}x ${item.name} - ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price || '0.00'}€`
    ).join('\n')}

📍 LIEFERUNG: ${data.delivery_location}
⏰ GEWÜNSCHTE ZEIT: ${data.desired_time}
📞 KONTAKT: ${data.contact_value}

${priceSection}

${roomServiceNotice}

${data.special_requests ? `⚠️  BESONDERE WÜNSCHE:
   ${data.special_requests}

` : ''}🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

╔══════════════════════════════════════════════════════════╗
║ STATUS: Neue Bestellung                                        ║
║ Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}                                ║
╚══════════════════════════════════════════════════════════╝`;
  }
}