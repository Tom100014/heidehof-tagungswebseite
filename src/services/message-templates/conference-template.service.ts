export interface ConferenceOrderData {
  guest_info: {
    firstName: string;
    lastName: string;
    company?: string;
    conferenceRoom: string;
    guestType: string;
  };
  lunch_menu: any;
  dinner_menu?: any;
  order_date: string;
  hotelFooter?: string;
  promotionalFooter?: string;
}

export class ConferenceMessageTemplateService {
  
  /**
   * Erstellt eine WhatsApp-Nachricht für Konferenz-Menü Bestellungen (für Gäste)
   * MIT dynamischem Footer aus hotel_settings
   */
  static formatWhatsAppMessage(data: ConferenceOrderData): string {
    const guestName = `${data.guest_info.firstName} ${data.guest_info.lastName}`;
    
    const baseMessage = `🏢 *Tagungsgast-Bestellung*

Guten Tag, ich bin ${guestName} und melde meine Mahlzeiten an:

👤 *Gastinformationen:*
Name: ${guestName}
${data.guest_info.company ? `Firma: ${data.guest_info.company}` : ''}
Gästetyp: ${data.guest_info.guestType}
Tagungsraum: ${data.guest_info.conferenceRoom}

🍽️ *Mahlzeiten für ${data.order_date}:*
🥗 Mittagessen: ${this.formatMenuSelection(data.lunch_menu)}
${data.dinner_menu ? `🍽️ Abendessen: ${this.formatMenuSelection(data.dinner_menu)} (nur bei Übernachtung)` : ''}

🔒 *Datenschutz:* Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de`;

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
    
    fullMessage += `\n\nVielen Dank!\n${guestName}`;
    
    return fullMessage;
  }

  /**
   * Erstellt Admin-Nachricht MIT Menü-Details für Küche
   */
  static formatAdminMessage(data: ConferenceOrderData): string {
    const guestName = `${data.guest_info.firstName} ${data.guest_info.lastName}`;
    
    return `🏢 *Tagungsgast-Bestellung*

👤 *Gast:* ${guestName}
${data.guest_info.company ? `🏢 Firma: ${data.guest_info.company}` : ''}
🚪 Tagungsraum: ${data.guest_info.conferenceRoom}
👥 Gästetyp: ${data.guest_info.guestType}

📅 *Bestelldatum:* ${data.order_date}

🥗 *Mittagsmenü:*
${this.formatMenuSelection(data.lunch_menu)}

${data.dinner_menu ? `🍽️ *Abendmenü:*
${this.formatMenuSelection(data.dinner_menu)}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ *HINWEISE FÜR KÜCHE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Menü pünktlich zur Pausenzeit bereitstellen
• Auf Allergien/Unverträglichkeiten achten
• Portionen gemäß Tagungsgäste-Standard
• Professionelles Anrichten`;
  }

  /**
   * Erstellt eine SMS-Nachricht für Konferenz-Menü
   */
  static formatSMSMessage(data: ConferenceOrderData): string {
    const guestName = `${data.guest_info.firstName} ${data.guest_info.lastName}`;
    
    return `*** KONFERENZ-MENÜ BESTELLUNG ***

${guestName}
${data.guest_info.company || ''}
Raum: ${data.guest_info.conferenceRoom}

DATUM: ${data.order_date}
LUNCH: ${this.formatMenuSelection(data.lunch_menu)}
${data.dinner_menu ? `DINNER: ${this.formatMenuSelection(data.dinner_menu)}` : ''}

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de
Hotel Heidehof - Ihr 4-Sterne Superior Erlebnis
🌐 www.der-heidehof.de`;
  }

  /**
   * Erstellt eine Kopiervorlage für Konferenz-Menü
   */
  static formatCopyText(data: ConferenceOrderData): string {
    const guestName = `${data.guest_info.firstName} ${data.guest_info.lastName}`;
    
    return `╔══════════════════════════════════════════════════════════╗
║                 KONFERENZ-MENÜ BESTELLUNG                     ║
║                   Hotel Heidehof Ingolstadt                   ║
╚══════════════════════════════════════════════════════════╝

👤 TAGUNGSGAST:
   Name: ${guestName}
   ${data.guest_info.company ? `Firma: ${data.guest_info.company}` : ''}
   Gästetyp: ${data.guest_info.guestType}
   Tagungsraum: ${data.guest_info.conferenceRoom}

📅 BESTELLDATUM: ${data.order_date}

🥗 MITTAGSMENÜ:
   ${this.formatMenuSelection(data.lunch_menu)}

${data.dinner_menu ? `🍽️ ABENDMENÜ:
   ${this.formatMenuSelection(data.dinner_menu)}
` : ''}
🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

╔══════════════════════════════════════════════════════════╗
║ STATUS: Neue Menü-Bestellung                                  ║
║ Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}                                ║
╚══════════════════════════════════════════════════════════╝`;
  }

  private static formatMenuSelection(menu: any): string {
    if (!menu) return 'Keine Auswahl';
    
    // Vereinfachte Menü-Darstellung
    return Object.entries(menu)
      .filter(([key, value]) => value)
      .map(([key, value]) => {
        const cleanKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
        return `${cleanKey}: ${value}`;
      })
      .join(', ') || 'Standard-Menü';
  }
}