
import { format } from "date-fns";
import { de } from "date-fns/locale";

export interface ReservationData {
  full_name: string;
  room_number: string;
  spa_key_number: string;
  reservation_date: Date;
  reservation_time: string;
  person_count: string;
  contact_value?: string;
  privacyAccepted: boolean;
  allowFutureContact: boolean;
}

export class ReservationMessageTemplateService {
  
  /**
   * Erstellt eine luxuriöse WhatsApp-Nachricht für das 5-Sterne Hotel Heidehof
   */
  static formatWhatsAppMessage(data: ReservationData, restaurantName: string = "Restaurant Maxwell"): string {
    const formattedDate = format(data.reservation_date, "EEEE, dd.MM.yyyy", { locale: de });
    
    return `✨ *EXKLUSIVE TISCHRESERVIERUNG* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏰 *HOTEL HEIDEHOF INGOLSTADT*
⭐ Ihr 5-Sterne Superior Erlebnis ⭐

🍽️ *${restaurantName}*
🕰️ Service-Zeiten: 18:00 - 20:00 Uhr

👑 *GÄSTE-INFORMATION*
🔸 Name: ${data.full_name}
🔸 Suite/Zimmer: ${data.room_number}
🔸 Spa-Schlüssel: ${data.spa_key_number}

📅 *RESERVIERUNG DETAILS*
🗓️ Datum: ${formattedDate}
⏰ Uhrzeit: ${data.reservation_time} Uhr
👥 Anzahl Gäste: ${data.person_count} ${parseInt(data.person_count) === 1 ? 'Person' : 'Personen'}

📱 *Kontakt:*
${data.contact_value || 'Keine Angabe'}

✅ *BESTÄTIGUNG ERBETEN*
Wir freuen uns auf Ihren Besuch und bitten um Bestätigung dieser Reservierung.

ℹ️ *HINWEIS:* Bei Lieferung von Speisen oder Getränken ins Zimmer fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an.

🔒 *DATENSCHUTZ*
Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 Hotel Heidehof - Ihr 4-Sterne Superior Erlebnis 🌟
💎 Ingolstadt • Exklusive Gastronomie 💎
🌐 Mehr Informationen: https://www.der-heidehof.de`;
  }

  /**
   * Erstellt eine elegante SMS-Nachricht für das Hotel Heidehof
   */
  static formatSMSMessage(data: ReservationData, restaurantName: string = "Restaurant Maxwell"): string {
    const formattedDate = format(data.reservation_date, "dd.MM.yyyy", { locale: de });
    
    return `*** HOTEL HEIDEHOF INGOLSTADT ***
5-Sterne Superior Tischreservierung

${restaurantName}
Service: 18:00-20:00 Uhr

GAST: ${data.full_name}
SUITE: ${data.room_number}
SPA-SCHLÜSSEL: ${data.spa_key_number}

RESERVIERUNG:
Datum: ${formattedDate}
Zeit: ${data.reservation_time} Uhr
Gäste: ${data.person_count}

📱 Kontakt:
${data.contact_value || 'Keine Angabe'}

Bitte bestätigen Sie diese exklusive Reservierung.

HINWEIS: Bei Lieferung von Speisen/Getränken ins Zimmer fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an.

DATENSCHUTZ: Akzeptiert, Widerruf an reservierung@der-heidehof.de

Mit herzlichen Grüßen
Ihr Hotel Heidehof Team
Ingolstadt - Ihr 4-Sterne Superior Erlebnis
🌐 www.der-heidehof.de`;
  }

  /**
   * Erstellt eine luxuriöse Kopiervorlage für das Hotel Heidehof
   */
  static formatCopyText(data: ReservationData, restaurantName: string = "Restaurant Maxwell"): string {
    const formattedDate = format(data.reservation_date, "EEEE, dd. MMMM yyyy", { locale: de });
    
    return `╔══════════════════════════════════════════════════════════╗
║                    HOTEL HEIDEHOF INGOLSTADT                   ║
║               ⭐ 5-Sterne Superior Erlebnis ⭐               ║
║                  EXKLUSIVE TISCHRESERVIERUNG                   ║
╚══════════════════════════════════════════════════════════╝

🏰 HOTEL INFORMATION:
   • Hotel Heidehof Ingolstadt
   • 5-Sterne Superior Kategorie
   • Exklusive Gastronomie & Culinary Excellence

👑 GÄSTE-INFORMATION:
   • Name: ${data.full_name}
   • Suite/Zimmer: ${data.room_number}
   • Spa-Schlüssel: ${data.spa_key_number}

🍽️ RESERVIERUNG DETAILS:
   • Restaurant: ${restaurantName}
   • Datum: ${formattedDate}
   • Uhrzeit: ${data.reservation_time} Uhr
   • Anzahl Gäste: ${data.person_count} ${parseInt(data.person_count) === 1 ? 'Person' : 'Personen'}

⏰ SERVICE-ZEITEN:
   • Täglich von 18:00 bis 20:00 Uhr
   • Exklusiver À-la-carte Service

╔══════════════════════════════════════════════════════════╗
║ STATUS: Bestätigung erbeten                                    ║
║ Erstellt: ${format(new Date(), "dd.MM.yyyy HH:mm")} Uhr                             ║
╚══════════════════════════════════════════════════════════╝

ℹ️  ZIMMERSERVICE:
   • Bei Lieferung von Speisen oder Getränken ins Zimmer
   • Fällt eine Zimmerservice-Gebühr von 5,00€ pro Bestellung an

🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

🌟 Mit herzlichen Grüßen
💎 Ihr Hotel Heidehof Team - Ihr 4-Sterne Superior Erlebnis
🏰 Ingolstadt • Bayern • Deutschland
🌐 Besuchen Sie uns: https://www.der-heidehof.de`;
  }

  /**
   * Validiert die Reservierungsdaten vor der Template-Generierung
   */
  static validateReservationData(data: ReservationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.full_name?.trim()) {
      errors.push("Name ist erforderlich");
    }

    if (!data.room_number?.trim()) {
      errors.push("Zimmernummer ist erforderlich");
    }

    if (!data.spa_key_number?.trim()) {
      errors.push("Spa-Schlüsselnummer ist erforderlich");
    }

    if (!data.reservation_time?.trim()) {
      errors.push("Reservierungszeit ist erforderlich");
    }

    if (!data.person_count?.trim()) {
      errors.push("Personenzahl ist erforderlich");
    }

    if (!data.reservation_date) {
      errors.push("Reservierungsdatum ist erforderlich");
    }

    if (!data.privacyAccepted) {
      errors.push("Datenschutzerklärung muss akzeptiert werden");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Erstellt alle verfügbaren Nachrichtenformate für Hotel Heidehof
   */
  static createAllFormats(data: ReservationData, restaurantName?: string) {
    const validation = this.validateReservationData(data);
    
    if (!validation.isValid) {
      throw new Error(`Ungültige Reservierungsdaten: ${validation.errors.join(', ')}`);
    }

    return {
      whatsapp: this.formatWhatsAppMessage(data, restaurantName),
      sms: this.formatSMSMessage(data, restaurantName),
      copy: this.formatCopyText(data, restaurantName),
      validation
    };
  }
}
