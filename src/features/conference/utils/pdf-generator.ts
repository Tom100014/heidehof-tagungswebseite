
import { jsPDF } from 'jspdf';

interface ConferenceOrderPdfData {
  personalInfo: {
    firstName: string;
    lastName: string;
    company: string;
    conferenceRoom: string;
  };
  guestType: string;
  lunchSelection: string;
  dinnerSelection?: string;
  menuDate: string;
}

// Hilfsfunktion für saubere Textbehandlung ohne Sonderzeichen
const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Entferne Prozentzeichen und andere problematische Sonderzeichen
  return text
    .replace(/%/g, ' Prozent')
    .replace(/[^\w\s\u00C0-\u017F\-.,;:!?()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const generateConferenceOrderPdf = (orderData: ConferenceOrderPdfData): Blob => {
  const doc = new jsPDF();
  
  // === HOTEL DER HEIDEHOF CORPORATE DESIGN ===
  
  // Schwarzer Header-Bereich
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Gold-Akzent Linie
  doc.setFillColor(212, 175, 55); // Heidehof Gold
  doc.rect(0, 0, 210, 4, 'F');
  
  // Hotel-Name im Header (Weiß auf Schwarz)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Hotel Der Heidehof - Conference & SPA Resort', 20, 18);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Restaurant Maxwell', 20, 26);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'italic');
  doc.text('Konferenz Menubestellung', 20, 34);
  
  // Zurück zu schwarzer Schrift für Inhalt
  doc.setTextColor(0, 0, 0);
  
  // Elegante goldene Trennlinie
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.5);
  doc.line(20, 48, 190, 48);
  
  let yPosition = 65;
  
  // === GAST-INFORMATIONEN IN ELEGANTER BOX ===
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, yPosition - 8, 170, 45, 4, 4, 'F');
  
  // Gold Border um Gast-Info
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.roundedRect(20, yPosition - 8, 170, 45, 4, 4, 'S');
  
  // Header für Gast-Informationen
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(20, yPosition - 8, 170, 12, 4, 4, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Gast-Informationen', 25, yPosition - 1);
  
  // Gast-Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${sanitizeText(orderData.personalInfo.firstName)} ${sanitizeText(orderData.personalInfo.lastName)}`, 25, yPosition + 12);
  doc.text(`Firma: ${sanitizeText(orderData.personalInfo.company)}`, 25, yPosition + 22);
  doc.text(`Tagungsraum: ${sanitizeText(orderData.personalInfo.conferenceRoom)}`, 25, yPosition + 32);
  
  // Gästetyp formatieren
  const guestTypeFormatted = orderData.guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Uebernachtung';
  doc.text(`Gaestetype: ${guestTypeFormatted}`, 100, yPosition + 12);
  doc.text(`Menue-Datum: ${sanitizeText(orderData.menuDate)}`, 100, yPosition + 22);
  
  yPosition += 65;
  
  // === MENÜ-AUSWAHL SEKTION ===
  // Eleganter Header mit Gold-Hintergrund
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(20, yPosition - 5, 170, 15, 3, 3, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Ihre Menue-Auswahl', 25, yPosition + 5);
  yPosition += 25;
  
  // === MITTAGESSEN SEKTION ===
  doc.setFillColor(255, 252, 242); // Sehr helles Gold
  doc.roundedRect(25, yPosition - 5, 160, 25, 2, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(184, 134, 11); // Dunkleres Gold
  doc.text('Mittagessen:', 30, yPosition + 3);
  yPosition += 12;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Aufteilen des Textes wenn er zu lang ist
  const lunchText = sanitizeText(orderData.lunchSelection);
  const lunchLines = doc.splitTextToSize(lunchText, 150);
  doc.text(lunchLines, 35, yPosition);
  yPosition += lunchLines.length * 5 + 20;
  
  // === ABENDESSEN SEKTION === (nur für Übernachtungsgäste)
  if (orderData.dinnerSelection) {
    doc.setFillColor(255, 252, 242); // Sehr helles Gold
    doc.roundedRect(25, yPosition - 5, 160, 25, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(184, 134, 11); // Dunkleres Gold
    doc.text('Abendessen:', 30, yPosition + 3);
    yPosition += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const dinnerText = sanitizeText(orderData.dinnerSelection);
    const dinnerLines = doc.splitTextToSize(dinnerText, 150);
    doc.text(dinnerLines, 35, yPosition);
    yPosition += dinnerLines.length * 5 + 20;
  }
  
  // Hinweis für Tagungsgäste ohne Übernachtung
  if (!orderData.dinnerSelection && (orderData.guestType === 'Tagungsgast' || orderData.guestType === 'day_guest')) {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(25, yPosition - 5, 160, 15, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Hinweis: Als Tagungsgast ohne Uebernachtung erhalten Sie nur das Mittagessen.', 30, yPosition + 5);
    yPosition += 25;
  }
  
  // === PROFESSIONELLER FOOTER ===
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 50;
  
  // Elegante goldene Trennlinie vor Footer
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.2);
  doc.line(20, footerY - 8, 190, footerY - 8);
  
  // Hotel-Name prominent
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Hotel Der Heidehof - Conference & SPA Resort', 20, footerY);
  
  // Kontaktdaten strukturiert und sauber
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ingolstaedter Strasse 121, 85080 Gaimersheim / Ingolstadt', 20, footerY + 10);
  doc.text('Tel.: +49 8458 640-0     Fax: +49 8458 64-230', 20, footerY + 18);
  doc.text('E-Mail: info@der-heidehof.de     Web: www.der-heidehof.de', 20, footerY + 26);
  
  // Restaurant-Slogan in Gold
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(184, 134, 11);
  doc.text('Restaurant Maxwell - Ihr kulinarischer Partner fuer unvergessliche Tagungen', 20, footerY + 36);
  
  // Erstellungsdatum dezent
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Erstellt am: ' + new Date().toLocaleString('de-DE'), 20, footerY + 44);
  
  // PDF als Blob zurückgeben
  return doc.output('blob');
};

export const downloadConferenceOrderPdf = (orderData: ConferenceOrderPdfData, filename?: string) => {
  const pdfBlob = generateConferenceOrderPdf(orderData);
  const url = URL.createObjectURL(pdfBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Restaurant-Maxwell-Bestellung-${orderData.personalInfo.lastName}-${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
