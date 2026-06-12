export interface DirectOrderConfirmationData {
  customer_name: string;
  order_type: string;
  delivery_minutes: 5 | 10 | 15 | 20 | 25 | 30;
  room_number?: string;
  order_reference?: string;
  message_content?: string;
}

export class DirectOrderConfirmationTemplateService {
  /**
   * Formatiert professionelle Bestätigungsnachricht für Direct Orders
   * WICHTIG: OHNE eingebauten Footer - wird extern hinzugefügt
   */
  static formatConfirmationMessage(data: DirectOrderConfirmationData): string {
    const customerName = data.customer_name || 'Geschätzte/r Gast/in';
    const salutation = this.getGenderSalutation(customerName);
    const lastName = this.getLastName(customerName);
    
    const roomInfo = data.room_number ? `\n📍 **Zustellung:** Zimmer ${data.room_number}` : '';
    const orderRef = data.order_reference ? `\n📋 **Referenz:** ${data.order_reference}` : '';
    
    return `✅ **BESTELLBESTÄTIGUNG - DER HEIDEHOF**

${salutation} ${lastName},

vielen Dank für Ihre Bestellung! Wir haben Ihre Anfrage erhalten und bearbeiten diese umgehend.${roomInfo}${orderRef}

Unsere Küche bereitet Ihre Bestellung frisch für Sie zu. Bei Fragen stehen wir Ihnen gerne zur Verfügung.

**Wir danken für Ihr Vertrauen und wünschen einen angenehmen Aufenthalt!**

Mit freundlichen Grüßen  
Ihr Der Heidehof Team`;
  }

  /**
   * SMS-Version der Bestätigungsnachricht (kompakter)
   * WICHTIG: OHNE eingebauten Footer - wird extern hinzugefügt
   */
  static formatSMSConfirmationMessage(data: DirectOrderConfirmationData): string {
    const customerName = data.customer_name || 'Gast';
    const salutation = this.getGenderSalutation(customerName);
    const lastName = this.getLastName(customerName);
    
    const roomInfo = data.room_number ? ` an Zimmer ${data.room_number}` : '';
    
    return `BESTELLBESTÄTIGUNG - DER HEIDEHOF

${salutation} ${lastName},

vielen Dank für Ihre Bestellung!${roomInfo}

Unsere Küche bereitet Ihre Bestellung frisch zu.

Mit freundlichen Grüßen
Ihr Der Heidehof Team`;
  }

  /**
   * Bestimmt Anrede basierend auf Vornamen
   */
  private static getGenderSalutation(fullName: string): string {
    const firstName = fullName.split(' ')[0]?.toLowerCase() || '';
    
    const femaleNames = [
      'anna', 'maria', 'sandra', 'andrea', 'petra', 'sabine', 'susanne', 'monika', 'birgit', 'gabriele',
      'claudia', 'stefanie', 'nicole', 'anja', 'katrin', 'julia', 'tanja', 'daniela', 'katharina', 'melanie',
      'christina', 'marion', 'ines', 'nadine', 'martina', 'silke', 'doris', 'barbara', 'simone', 'alexandra',
      'elena', 'sarah', 'laura', 'jessica', 'lisa', 'jennifer', 'michelle', 'stephanie', 'vanessa', 'janina',
      'anke', 'heike', 'kerstin', 'manuela', 'renate', 'cornelia', 'dagmar', 'eva', 'gisela', 'ursula'
    ];
    
    const maleNames = [
      'michael', 'andreas', 'thomas', 'stefan', 'christian', 'matthias', 'uwe', 'klaus', 'jürgen', 'frank',
      'wolfgang', 'bernd', 'werner', 'rainer', 'günter', 'hans', 'peter', 'horst', 'dieter', 'gerhard',
      'alexander', 'martin', 'daniel', 'sebastian', 'david', 'markus', 'oliver', 'tobias', 'patrick', 'dennis',
      'florian', 'benjamin', 'tim', 'max', 'jan', 'philipp', 'marcel', 'simon', 'kevin', 'christopher',
      'lars', 'steffen', 'sven', 'marco', 'andré', 'kai', 'thorsten', 'rené', 'jens', 'dirk'
    ];
    
    if (femaleNames.includes(firstName)) {
      return 'Sehr geehrte Frau';
    } else if (maleNames.includes(firstName)) {
      return 'Sehr geehrter Herr';
    } else {
      return 'Sehr geehrte/r';
    }
  }

  /**
   * Extrahiert Nachnamen
   */
  private static getLastName(fullName: string): string {
    const nameParts = fullName.trim().split(' ');
    return nameParts[nameParts.length - 1] || fullName;
  }
}