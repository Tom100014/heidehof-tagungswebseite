export interface ContactRequestData {
  name: string;
  contact_type: string;
  contact_value?: string;
  room_number?: string;
  category?: string;
  complaint_text?: string;
  service_context?: any;
  priority?: string;
  hotelFooter?: string;
  promotionalFooter?: string;
}

export class ContactMessageTemplateService {
  
  /**
   * Erstellt eine einfache WhatsApp-Nachricht für Beschwerden/Anfragen (für Gäste)
   * MIT dynamischem Footer aus hotel_settings
   */
  static formatWhatsAppMessage(data: ContactRequestData): string {
    const baseMessage = data.complaint_text || `Kontaktanfrage von ${data.name}`;
    
    let fullMessage = `${baseMessage}

🔒 Datenschutz: Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de`;

    // Füge Footer hinzu
    if (data.promotionalFooter) {
      fullMessage += `\n\n${data.promotionalFooter}`;
    }
    
    if (data.hotelFooter) {
      fullMessage += `\n\n${data.hotelFooter}`;
    } else {
      fullMessage += `\n\n─────────────────────────────────\nHotel Der Heidehof\nConference & SPA Resort ★★★★Superior\n📞 Telefon: +49 8458 64-0\n🌐 www.der-heidehof.de\n─────────────────────────────────`;
    }
    
    return fullMessage;
  }

  /**
   * Erstellt Admin-Nachricht für Beschwerdemanagement
   */
  static formatAdminMessage(data: ContactRequestData): string {
    return `📞 *${data.category || 'Kontaktanfrage'}*

👤 *Gast:* ${data.name}
${data.room_number ? `🏨 Zimmer: ${data.room_number}` : ''}

⚠️ *Priorität:* ${data.priority || 'Normal'}

📝 *Nachricht:*
${data.complaint_text || 'Keine Details verfügbar'}

📞 *Kontakt:* ${data.contact_value}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *SOFORT HANDELN!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Gast innerhalb von 15 Min kontaktieren
• Situation ernst nehmen
• Lösung anbieten
• Nachverfolgung sicherstellen`;
  }

  /**
   * Erstellt eine SMS-Nachricht für Kontaktanfragen
   */
  static formatSMSMessage(data: ContactRequestData): string {
    return `*** KONTAKTANFRAGE ***

${data.name}
${data.room_number ? `Zimmer: ${data.room_number}` : ''}

KATEGORIE: ${data.category || 'Allgemein'}
NACHRICHT: ${data.complaint_text || 'Keine Details'}

Kontakt: ${data.contact_value}

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de
Hotel Heidehof - Ihr 4-Sterne Superior Erlebnis
🌐 www.der-heidehof.de`;
  }

  /**
   * Erstellt eine Kopiervorlage für Kontaktanfragen
   */
  static formatCopyText(data: ContactRequestData): string {
    return `╔══════════════════════════════════════════════════════════╗
║                      KONTAKTANFRAGE                            ║
║                   Hotel Heidehof Ingolstadt                   ║
╚══════════════════════════════════════════════════════════╝

👤 GAST: ${data.name}
${data.room_number ? `🏨 Zimmer: ${data.room_number}` : ''}

📋 KATEGORIE: ${data.category || 'Allgemein'}
⚠️  PRIORITÄT: ${data.priority || 'Normal'}

📝 NACHRICHT:
   ${data.complaint_text || 'Keine Details verfügbar'}

📞 KONTAKT:
   Art: ${data.contact_type}
   ${data.contact_value ? `Kontakt: ${data.contact_value}` : ''}

🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

╔══════════════════════════════════════════════════════════╗
║ STATUS: Neue Anfrage                                          ║
║ Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}                                ║
╚══════════════════════════════════════════════════════════╝`;
  }
}