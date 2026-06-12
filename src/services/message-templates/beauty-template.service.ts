export interface BeautyAppointmentData {
  name: string;
  room_number?: string;
  contact_method: string;
  contact_value: string;
  appointment_date: string;
  time_preference: string;
  exact_time?: string;
  treatment_name?: string;
  treatment_id?: string;
  notes?: string;
  guest_type?: string;
  hotelFooter?: string;
  promotionalFooter?: string;
}

/**
 * Behandlungshinweise für Therapeuten
 */
const TREATMENT_INSTRUCTIONS: { [key: string]: string } = {
  'massage': '💆 MASSAGE VORBEREITUNG:\n   • Raum auf 22-24°C vorheizen\n   • Handtücher vorwärmen\n   • Öle bereitstellen (Lavendel, Arnika, neutral)\n   • Entspannungsmusik (leise)\n   • Kerzen anzünden\n   ABLAUF: Gast begrüßen, Vorgespräch, Druckpunkte abklären, 60 Min Behandlung, Nachruhe anbieten',
  'gesichtsbehandlung': '✨ GESICHTSBEHANDLUNG:\n   • Hauttyp vorab analysieren\n   • Produkte entsprechend auswählen (trockene/fettige/Mischhaut)\n   • Dampfgerät vorbereiten\n   • Reinigung → Peeling → Maske → Pflege\n   • Dauer: 75-90 Min\n   WICHTIG: Allergie-Check bei Erstbehandlung!',
  'maniküre': '💅 MANIKÜRE STATION:\n   • UV-Lampe bereithalten\n   • Farben nach Kundenwunsch\n   • Nagelhautöl, Feilen, Buffer\n   • Hygiene: frische Handtücher\n   ABLAUF: Nägel kürzen/feilen → Nagelhaut → Lackieren → Trocknen (3-5 Min)',
  'pediküre': '🦶 PEDIKÜRE STATION:\n   • Fußbad vorbereiten (38°C, ätherische Öle)\n   • Hornhautfeile, Zehentrenner\n   • Pflegeprodukte für Füße\n   ABLAUF: Fußbad (10 Min) → Hornhaut entfernen → Nägel schneiden → Lackieren',
  'sauna': '🧖 SAUNA VORBEREITUNG:\n   • Temperatur: 80-90°C\n   • Aufguss-Zubehör bereitstellen\n   • Handtücher im Wärmebereich\n   • Ruhebereich vorbereiten\n   HINWEIS: Max. 15 Min pro Durchgang, danach Abkühlung',
  'spa': '🌊 SPA PAKET ABLAUF:\n   • Empfang mit Tee/Wasser\n   • Wellness-Bademantel bereitstellen\n   • Reihenfolge: Sauna → Pool → Massage → Ruhebereich\n   • Gesamtdauer: 2-3 Stunden\n   EXTRAS: Obst-Platte, Getränke, Zeitschriften'
};

/**
 * Baut Behandlungshinweise für Therapeuten
 */
function buildTreatmentInstructions(treatmentName?: string): string {
  if (!treatmentName) return '';
  
  const lowerName = treatmentName.toLowerCase();
  const instructions: string[] = [];
  
  // Suche nach passenden Behandlungshinweisen
  for (const [key, instruction] of Object.entries(TREATMENT_INSTRUCTIONS)) {
    if (lowerName.includes(key)) {
      instructions.push(`\n${instruction}`);
      break;
    }
  }
  
  // Fallback für unbekannte Behandlungen
  if (instructions.length === 0) {
    instructions.push(`\n💆 *${treatmentName}:*`);
    instructions.push(`   • Behandlungsraum vorbereiten (sauber, warm, entspannend)`);
    instructions.push(`   • Alle notwendigen Produkte bereitstellen`);
    instructions.push(`   • Gast über Ablauf informieren`);
    instructions.push(`   • Nach Allergien/Unverträglichkeiten fragen`);
  }
  
  return instructions.length > 0
    ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💆 *BEHANDLUNGSHINWEISE FÜR THERAPEUTEN*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${instructions.join('\n')}\n\n⚠️ *WICHTIG:* Gast-Komfort und Hygiene haben höchste Priorität!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : '';
}

export class BeautyMessageTemplateService {
  
  /**
   * Erstellt eine WhatsApp-Nachricht für Beauty & Wellness Termine (für Gäste)
   * MIT dynamischem Footer aus hotel_settings
   */
  static formatWhatsAppMessage(data: BeautyAppointmentData): string {
    const timeDisplay = data.exact_time || this.getTimePreferenceText(data.time_preference);
    const guestInfo = data.room_number 
      ? `Hotelgast (Zimmer ${data.room_number})`
      : 'Wellness-Gast';

    const baseMessage = `✨ *Beauty-Behandlung Terminanfrage* ✨

Guten Tag, mein Name ist ${data.name} und ich möchte gerne einen Termin vereinbaren.

💆 *Gewünschte Behandlung:*
${data.treatment_name || 'Beauty-Behandlung'}

📅 *Wunschtermin:*
Datum: ${data.appointment_date}
⏰ *Bevorzugte Zeit:* ${timeDisplay}

👤 *Gastinformationen:*
${guestInfo}

📱 *Kontakt:*
${data.contact_value}

${data.notes ? `📝 *Anmerkungen:*
${data.notes}

` : ''}🔒 *Datenschutz:* Ich habe die Datenschutzerklärung gelesen und akzeptiert. Widerruf jederzeit möglich an: reservierung@der-heidehof.de`;

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
    
    fullMessage += '\n\nVielen Dank im Voraus!';
    
    return fullMessage;
  }

  /**
   * Erstellt Admin-Nachricht MIT BEHANDLUNGSHINWEISEN für Therapeuten
   */
  static formatAdminMessage(data: BeautyAppointmentData): string {
    const timeDisplay = data.exact_time || this.getTimePreferenceText(data.time_preference);
    const guestInfo = data.room_number 
      ? `*Hotelgast* (Zimmer ${data.room_number})`
      : 'Wellness-Gast';
    
    const treatmentInstructions = buildTreatmentInstructions(data.treatment_name);

    return `✨ *Beauty-Behandlung Terminanfrage* ✨

👤 *Gast:* ${data.name}
${guestInfo}

💆 *Gewünschte Behandlung:*
${data.treatment_name || 'Beauty-Behandlung'}

📅 *Wunschtermin:*
Datum: ${data.appointment_date}
⏰ *Bevorzugte Zeit:* ${timeDisplay}

${data.notes ? `📝 *Anmerkungen:*
${data.notes}

` : ''}📱 *Kontakt:* ${data.contact_value}${treatmentInstructions}`;
  }

  /**
   * Erstellt eine SMS-Nachricht für Beauty & Wellness
   */
  static formatSMSMessage(data: BeautyAppointmentData): string {
    const timeDisplay = data.exact_time || this.getTimePreferenceText(data.time_preference);
    
    return `*** BEAUTY & WELLNESS TERMIN ***

${data.name}
${data.room_number ? `Zimmer: ${data.room_number}` : 'Wellness-Gast'}

BEHANDLUNG: ${data.treatment_name || 'Beauty-Behandlung'}
DATUM: ${data.appointment_date}
ZEIT: ${timeDisplay}

📱 Kontakt:
${data.contact_value}

Datenschutz: Akzeptiert, Widerruf an reservierung@der-heidehof.de
Hotel Heidehof Beauty Team`;
  }

  /**
   * Erstellt eine Kopiervorlage für Beauty & Wellness
   */
  static formatCopyText(data: BeautyAppointmentData): string {
    const timeDisplay = data.exact_time || this.getTimePreferenceText(data.time_preference);
    
    return `╔══════════════════════════════════════════════════════════╗
║                 BEAUTY & WELLNESS TERMINANFRAGE               ║
║                   Hotel Heidehof Ingolstadt                   ║
╚══════════════════════════════════════════════════════════╝

👤 GAST: ${data.name}
🏨 ${data.room_number ? `Zimmer: ${data.room_number}` : 'Wellness-Gast'}

💆 BEHANDLUNG:
   ${data.treatment_name || 'Beauty-Behandlung'}
   ${data.treatment_id ? `ID: ${data.treatment_id}` : ''}

📅 TERMINWUNSCH:
   Datum: ${data.appointment_date}
   Zeit: ${timeDisplay}

📞 KONTAKT:
   Methode: ${data.contact_method}
   ${data.contact_value}

${data.notes ? `📝 BESONDERE WÜNSCHE:
   ${data.notes}

` : ''}🔒 DATENSCHUTZ:
   • Ich habe die Datenschutzerklärung gelesen und akzeptiert
   • Widerruf jederzeit möglich an: reservierung@der-heidehof.de

╔══════════════════════════════════════════════════════════╗
║ STATUS: Neue Terminanfrage                                    ║
║ Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}                                ║
╚══════════════════════════════════════════════════════════╝`;
  }

  private static getTimePreferenceText(preference: string): string {
    switch (preference) {
      case 'morning': return 'Vormittag (9:00-12:00)';
      case 'afternoon': return 'Nachmittag (12:00-17:00)';
      case 'evening': return 'Abend (17:00-20:00)';
      default: return preference;
    }
  }
}
