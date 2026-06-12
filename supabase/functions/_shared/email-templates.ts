// Shared email templates for all Edge Functions

interface OrderData {
  customerName: string;
  contactValue: string;
  roomNumber: string;
  items: string;
  totalAmount: number;
  orderId: string;
  deliveryLocation: string;
  desiredTime: string;
}

interface ReservationData {
  customerName: string;
  contactValue: string;
  roomNumber: string;
  reservationDate: string;
  reservationTime: string;
  personCount: string;
  reservationId: string;
}

interface ContactFormData {
  customerName: string;
  contactValue: string;
  roomNumber: string;
  message: string;
  contactId: string;
}

export function getOrderEmailTemplate(data: OrderData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bestellbestätigung - Hotel Heidehof</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #2c3e50; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C9A96E; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #5a5a5a; }
        .info-value { color: #2c3e50; }
        .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .social-links { margin: 15px 0; }
        .social-links a { color: #C9A96E; text-decoration: none; margin: 0 10px; }
        .contact-info { margin: 10px 0; }
        @media (max-width: 600px) {
          .container { margin: 10px; border-radius: 5px; }
          .header, .content { padding: 20px; }
          .info-row { flex-direction: column; }
          .info-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏨 Hotel Heidehof</div>
          <div class="subtitle">Wellness • Genuss • Erholung</div>
        </div>
        
        <div class="content">
          <div class="greeting">Liebe/r ${data.customerName},</div>
          
          <p>vielen Dank für Ihre Bestellung! Wir haben Ihre Bestellung erhalten und bereiten alles für Sie vor.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #C9A96E;">📋 Ihre Bestellung</h3>
            <div class="info-row">
              <span class="info-label">Bestell-ID:</span>
              <span class="info-value">${data.orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Zimmernummer:</span>
              <span class="info-value">${data.roomNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lieferort:</span>
              <span class="info-value">${data.deliveryLocation}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Gewünschte Zeit:</span>
              <span class="info-value">${data.desiredTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Gesamtbetrag:</span>
              <span class="info-value">${data.totalAmount.toFixed(2)}€</span>
            </div>
          </div>
          
          <div style="background: #fff; border: 1px solid #e1e8ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #C9A96E;">🍽️ Bestellte Artikel:</h4>
            <p style="margin: 0; line-height: 1.6;">${data.items}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://hotel-heidehof-ingolstadt.de" class="cta-button">
              🌐 Zur Website
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div><strong>🏨 Hotel Heidehof</strong></div>
          <div class="contact-info">
            <div>📍 Manchinger Str. 7, 85053 Ingolstadt</div>
            <div>☎️ +49 841 95444-0</div>
            <div>📧 info@hotel-heidehof-ingolstadt.de</div>
          </div>
          <div class="social-links">
            <a href="https://hotel-heidehof-ingolstadt.de">Website</a> |
            <a href="mailto:info@hotel-heidehof-ingolstadt.de">E-Mail</a>
          </div>
          <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            © 2024 Hotel Heidehof Ingolstadt. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getReservationEmailTemplate(data: ReservationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reservierungsbestätigung - Hotel Heidehof</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #2c3e50; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C9A96E; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #5a5a5a; }
        .info-value { color: #2c3e50; }
        .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .social-links { margin: 15px 0; }
        .social-links a { color: #C9A96E; text-decoration: none; margin: 0 10px; }
        .contact-info { margin: 10px 0; }
        @media (max-width: 600px) {
          .container { margin: 10px; border-radius: 5px; }
          .header, .content { padding: 20px; }
          .info-row { flex-direction: column; }
          .info-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏨 Hotel Heidehof</div>
          <div class="subtitle">Wellness • Genuss • Erholung</div>
        </div>
        
        <div class="content">
          <div class="greeting">Liebe/r ${data.customerName},</div>
          
          <p>vielen Dank für Ihre Reservierung! Wir freuen uns auf Ihren Besuch.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #C9A96E;">📅 Ihre Reservierung</h3>
            <div class="info-row">
              <span class="info-label">Reservierungs-ID:</span>
              <span class="info-value">${data.reservationId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Datum:</span>
              <span class="info-value">${data.reservationDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Uhrzeit:</span>
              <span class="info-value">${data.reservationTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Personenanzahl:</span>
              <span class="info-value">${data.personCount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Zimmernummer:</span>
              <span class="info-value">${data.roomNumber}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://hotel-heidehof-ingolstadt.de" class="cta-button">
              🌐 Zur Website
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div><strong>🏨 Hotel Heidehof</strong></div>
          <div class="contact-info">
            <div>📍 Manchinger Str. 7, 85053 Ingolstadt</div>
            <div>☎️ +49 841 95444-0</div>
            <div>📧 info@hotel-heidehof-ingolstadt.de</div>
          </div>
          <div class="social-links">
            <a href="https://hotel-heidehof-ingolstadt.de">Website</a> |
            <a href="mailto:info@hotel-heidehof-ingolstadt.de">E-Mail</a>
          </div>
          <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            © 2024 Hotel Heidehof Ingolstadt. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBarMaxOrderEmailTemplate(data: OrderData): string {
  return getOrderEmailTemplate(data);
}

export function getConferenceOrderEmailTemplate(data: OrderData): string {
  return getOrderEmailTemplate(data);
}

export function getContactFormEmailTemplate(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kontaktanfrage Bestätigung - Hotel Heidehof</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #2c3e50; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C9A96E; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #5a5a5a; }
        .info-value { color: #2c3e50; }
        .message-box { background: #fff; border: 1px solid #e1e8ed; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #C9A96E 0%, #8B7355 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .social-links { margin: 15px 0; }
        .social-links a { color: #C9A96E; text-decoration: none; margin: 0 10px; }
        .contact-info { margin: 10px 0; }
        @media (max-width: 600px) {
          .container { margin: 10px; border-radius: 5px; }
          .header, .content { padding: 20px; }
          .info-row { flex-direction: column; }
          .info-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏨 Hotel Heidehof</div>
          <div class="subtitle">Wellness • Genuss • Erholung</div>
        </div>
        
        <div class="content">
          <div class="greeting">Liebe/r ${data.customerName},</div>
          
          <p>vielen Dank für Ihre Kontaktanfrage! Wir haben Ihre Nachricht erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #C9A96E;">📋 Ihre Anfrage im Überblick</h3>
            <div class="info-row">
              <span class="info-label">Referenz-ID:</span>
              <span class="info-value">${data.contactId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${data.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">E-Mail:</span>
              <span class="info-value">${data.contactValue}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Zimmernummer:</span>
              <span class="info-value">${data.roomNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Eingangsdatum:</span>
              <span class="info-value">${new Date().toLocaleDateString('de-DE')}</span>
            </div>
          </div>
          
          <div class="message-box">
            <h4 style="margin-top: 0; color: #C9A96E;">💬 Ihre Nachricht:</h4>
            <p style="margin: 0; line-height: 1.6;">${data.message}</p>
          </div>
          
          <p><strong>⏰ Bearbeitungszeit:</strong> Wir bearbeiten Ihre Anfrage normalerweise innerhalb von 24 Stunden während unserer Geschäftszeiten.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://hotel-heidehof-ingolstadt.de" class="cta-button">
              🌐 Zur Website
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Bei dringenden Anliegen können Sie uns auch direkt unter <strong>+49 841 95444-0</strong> erreichen.
          </p>
        </div>
        
        <div class="footer">
          <div><strong>🏨 Hotel Heidehof</strong></div>
          <div class="contact-info">
            <div>📍 Manchinger Str. 7, 85053 Ingolstadt</div>
            <div>☎️ +49 841 95444-0</div>
            <div>📧 info@hotel-heidehof-ingolstadt.de</div>
          </div>
          <div class="social-links">
            <a href="https://hotel-heidehof-ingolstadt.de">Website</a> |
            <a href="mailto:info@hotel-heidehof-ingolstadt.de">E-Mail</a>
          </div>
          <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            © 2024 Hotel Heidehof Ingolstadt. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Export all template functions - Note: Individual functions are already exported above