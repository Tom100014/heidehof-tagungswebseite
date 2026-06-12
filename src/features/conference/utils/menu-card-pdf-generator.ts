// @ts-nocheck
import { jsPDF } from 'jspdf';
import { ConferenceMenu } from "@/services/conference/menu-service";
import { saveMenuCardToDatabase } from '@/services/conference/menu-card-storage.service';
import { supabase } from '@/integrations/supabase/client';

interface MenuCardPdfData {
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
  menuData: ConferenceMenu;
}

const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('Image could not be loaded:', imageUrl);
      return null;
    }
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Fehler beim Laden des Bildes:', error);
    return null;
  }
};

const loadMenuImages = async (menuId: string) => {
  try {
    console.log('=== LADE MENÜ-BILDER ===', menuId);
    
    // Load main menu image
    const { data: menuImageData } = await supabase
      .from('conference_menu_images')
      .select('image_url')
      .eq('menu_id', menuId)
      .maybeSingle();
    
    console.log('=== MENÜ-HAUPTBILD ===', menuImageData?.image_url);
    
    return {
      mainImage: menuImageData?.image_url || null
    };
  } catch (error) {
    console.error('=== FEHLER BEIM LADEN DER BILDER ===', error);
    return { mainImage: null };
  }
};

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

export const generateMenuCardPdf = async (orderData: MenuCardPdfData): Promise<Blob> => {
  try {
    console.log('=== PDF GENERIERUNG START ===');
    console.log('Order Data:', orderData);
    
    const doc = new jsPDF();
    
    // Prüfen ob menuData vorhanden ist
    if (!orderData.menuData) {
      throw new Error('Keine Menü-Daten verfügbar');
    }
    
    // Hotel Der Heidehof Corporate Design - Schwarzer Header-Bereich
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
    doc.text('Ihre persoenliche Menuekarte', 20, 34);
    
    // Zurück zu schwarzer Schrift für Inhalt
    doc.setTextColor(0, 0, 0);
    
    // Elegante goldene Trennlinie
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.line(20, 48, 190, 48);
    
    let yPosition = 65;
    
    // Personalisierte Gast-Informationen in elegantem Stil
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(20, yPosition - 8, 170, 28, 4, 4, 'F');
    
    // Gold Border um Gast-Info
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.roundedRect(20, yPosition - 8, 170, 28, 4, 4, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Gast:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(`${orderData.personalInfo.firstName} ${orderData.personalInfo.lastName}`), 60, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Datum:', 25, yPosition + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(orderData.menuDate), 60, yPosition + 12);
    
    yPosition += 50;
    
    // === MITTAGSMENÜ SEKTION ===
    // Eleganter Header mit Gold-Hintergrund
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(20, yPosition - 5, 170, 15, 3, 3, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Mittagsmenue', 25, yPosition + 5);
    yPosition += 25;
    
    // Vorspeise mit professionellem Layout
    if (orderData.menuData.lunch_appetizer) {
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(25, yPosition - 5, 160, 20, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Vorspeise', 30, yPosition + 3);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const appetizerText = sanitizeText(orderData.menuData.lunch_appetizer);
      const appetizerLines = doc.splitTextToSize(appetizerText, 150);
      doc.text(appetizerLines, 35, yPosition);
      yPosition += appetizerLines.length * 5 + 15;
    }
    
    // Hauptgericht mit Gold-Akzent (nur das ausgewählte)
    doc.setFillColor(255, 252, 242); // Sehr helles Gold
    doc.roundedRect(25, yPosition - 5, 160, 25, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Hauptgericht', 30, yPosition + 3);
    yPosition += 10;
    
    let selectedLunchDish = null;
    if (orderData.lunchSelection.includes('fish') && orderData.menuData.lunch_main_dish_fish) {
      selectedLunchDish = typeof orderData.menuData.lunch_main_dish_fish === 'string' 
        ? JSON.parse(orderData.menuData.lunch_main_dish_fish) 
        : orderData.menuData.lunch_main_dish_fish;
    } else if (orderData.lunchSelection.includes('meat') && orderData.menuData.lunch_main_dish_meat) {
      selectedLunchDish = typeof orderData.menuData.lunch_main_dish_meat === 'string' 
        ? JSON.parse(orderData.menuData.lunch_main_dish_meat) 
        : orderData.menuData.lunch_main_dish_meat;
    } else if (orderData.lunchSelection.includes('veg') && orderData.menuData.lunch_main_dish_vegetarian) {
      selectedLunchDish = typeof orderData.menuData.lunch_main_dish_vegetarian === 'string' 
        ? JSON.parse(orderData.menuData.lunch_main_dish_vegetarian) 
        : orderData.menuData.lunch_main_dish_vegetarian;
    }
    
    if (selectedLunchDish && selectedLunchDish.name) {
      // Speisename in Gold
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(184, 134, 11); // Dunkleres Gold für bessere Lesbarkeit
      const dishName = sanitizeText(selectedLunchDish.name);
      doc.text(dishName, 35, yPosition);
      yPosition += 8;
      
      // Beschreibung
      if (selectedLunchDish.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const dishDescription = sanitizeText(selectedLunchDish.description);
        const dishLines = doc.splitTextToSize(dishDescription, 150);
        doc.text(dishLines, 35, yPosition);
        yPosition += dishLines.length * 5 + 5;
      }
    }
    yPosition += 15;
    
    // Nachspeise
    if (orderData.menuData.lunch_dessert) {
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(25, yPosition - 5, 160, 20, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Nachspeise', 30, yPosition + 3);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dessertText = sanitizeText(orderData.menuData.lunch_dessert);
      const dessertLines = doc.splitTextToSize(dessertText, 150);
      doc.text(dessertLines, 35, yPosition);
      yPosition += dessertLines.length * 5 + 25;
    }
    
    // === ABENDMENÜ SEKTION === (nur für Übernachtungsgäste)
    if (orderData.dinnerSelection && orderData.menuData.dinner_appetizer) {
      // Neue Seite wenn nötig
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 30;
        
        // Header auf neuer Seite wiederholen (verkürzt)
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setFillColor(212, 175, 55);
        doc.rect(0, 0, 210, 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Hotel Der Heidehof - Conference & SPA Resort', 20, 15);
        
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1);
        doc.line(20, 30, 190, 30);
        yPosition = 45;
      }
      
      // Eleganter Abendmenü-Header mit Gold-Hintergrund
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(20, yPosition - 5, 170, 15, 3, 3, 'F');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Abendmenue', 25, yPosition + 5);
      yPosition += 25;
      
      // Vorspeise mit professionellem Layout
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(25, yPosition - 5, 160, 20, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Vorspeise', 30, yPosition + 3);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dinnerAppetizerText = sanitizeText(orderData.menuData.dinner_appetizer);
      const dinnerAppetizerLines = doc.splitTextToSize(dinnerAppetizerText, 150);
      doc.text(dinnerAppetizerLines, 35, yPosition);
      yPosition += dinnerAppetizerLines.length * 5 + 15;
      
      // Hauptgericht mit Gold-Akzent (nur das ausgewählte)
      doc.setFillColor(255, 252, 242); // Sehr helles Gold
      doc.roundedRect(25, yPosition - 5, 160, 25, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Hauptgericht', 30, yPosition + 3);
      yPosition += 10;
      
      let selectedDinnerDish = null;
      if (orderData.dinnerSelection.includes('fish') && orderData.menuData.dinner_main_dish_fish) {
        selectedDinnerDish = typeof orderData.menuData.dinner_main_dish_fish === 'string' 
          ? JSON.parse(orderData.menuData.dinner_main_dish_fish) 
          : orderData.menuData.dinner_main_dish_fish;
      } else if (orderData.dinnerSelection.includes('meat') && orderData.menuData.dinner_main_dish_meat) {
        selectedDinnerDish = typeof orderData.menuData.dinner_main_dish_meat === 'string' 
          ? JSON.parse(orderData.menuData.dinner_main_dish_meat) 
          : orderData.menuData.dinner_main_dish_meat;
      } else if (orderData.dinnerSelection.includes('veg') && orderData.menuData.dinner_main_dish_vegetarian) {
        selectedDinnerDish = typeof orderData.menuData.dinner_main_dish_vegetarian === 'string' 
          ? JSON.parse(orderData.menuData.dinner_main_dish_vegetarian) 
          : orderData.menuData.dinner_main_dish_vegetarian;
      }
      
      if (selectedDinnerDish && selectedDinnerDish.name) {
        // Speisename in Gold
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(184, 134, 11); // Dunkleres Gold für bessere Lesbarkeit
        const dinnerDishName = sanitizeText(selectedDinnerDish.name);
        doc.text(dinnerDishName, 35, yPosition);
        yPosition += 8;
        
        // Beschreibung
        if (selectedDinnerDish.description) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const dinnerDishDescription = sanitizeText(selectedDinnerDish.description);
          const dinnerDishLines = doc.splitTextToSize(dinnerDishDescription, 150);
          doc.text(dinnerDishLines, 35, yPosition);
          yPosition += dinnerDishLines.length * 5 + 5;
        }
      }
      yPosition += 15;
      
      // Nachspeise
      if (orderData.menuData.dinner_dessert) {
        doc.setFillColor(248, 248, 248);
        doc.roundedRect(25, yPosition - 5, 160, 20, 2, 2, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Nachspeise', 30, yPosition + 3);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dinnerDessertText = sanitizeText(orderData.menuData.dinner_dessert);
        const dinnerDessertLines = doc.splitTextToSize(dinnerDessertText, 150);
        doc.text(dinnerDessertLines, 35, yPosition);
        yPosition += dinnerDessertLines.length * 5;
      }
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
    doc.text('Restaurant Maxwell - Ihr kulinarischer Partner fuer unvergessliche Momente', 20, footerY + 36);
    
    // Erstellungsdatum dezent
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Erstellt am: ' + new Date().toLocaleString('de-DE'), 20, footerY + 44);
    
    const pdfBlob = doc.output('blob');
    console.log('=== PDF ERFOLGREICH GENERIERT ===', 'Größe:', pdfBlob.size, 'bytes');
    
    if (pdfBlob.size === 0) {
      throw new Error('PDF konnte nicht erstellt werden - leere Datei');
    }
    
    return pdfBlob;
  } catch (error) {
    console.error('=== FEHLER BEI PDF GENERIERUNG ===', error);
    throw new Error(`PDF-Generierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};

export const saveMenuCardOnly = async (orderData: MenuCardPdfData, filename?: string) => {
  try {
    console.log('=== SPEICHERN START ===');
    const pdfBlob = await generateMenuCardPdf(orderData);
    const finalFilename = filename || `Restaurant-Maxwell-Menukarte-${orderData.personalInfo.lastName}-${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
    
    console.log('=== DATENBANK SPEICHERUNG START ===');
    const saveResult = await saveMenuCardToDatabase({
      personalInfo: orderData.personalInfo,
      guestType: orderData.guestType,
      lunchSelection: orderData.lunchSelection,
      dinnerSelection: orderData.dinnerSelection,
      menuDate: orderData.menuDate,
      pdfBlob,
      filename: finalFilename
    });
    
    console.log('=== SPEICHER-ERGEBNIS ===', saveResult);
    return saveResult;
  } catch (error) {
    console.error('=== FEHLER BEIM SPEICHERN ===', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern' };
  }
};

export const downloadMenuCardPdf = async (orderData: MenuCardPdfData, filename?: string) => {
  try {
    console.log('=== DOWNLOAD START ===');
    const pdfBlob = await generateMenuCardPdf(orderData);
    const finalFilename = filename || `Restaurant-Maxwell-Menukarte-${orderData.personalInfo.lastName}-${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
    
    console.log('=== DOWNLOAD VORBEREITUNG ===', 'Filename:', finalFilename, 'Blob Size:', pdfBlob.size);
    
    // Erstelle Download Link mit Timeout für bessere Browser-Kompatibilität
    const url = URL.createObjectURL(pdfBlob);
    
    // Verwende einen setTimeout um sicherzustellen, dass der Download funktioniert
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      
      // Füge den Link zum DOM hinzu, klicke und entferne ihn
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup nach kurzer Verzögerung
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    }, 100);
    
    // Parallel: Speichere in Datenbank (optional)
    try {
      const saveResult = await saveMenuCardToDatabase({
        personalInfo: orderData.personalInfo,
        guestType: orderData.guestType,
        lunchSelection: orderData.lunchSelection,
        dinnerSelection: orderData.dinnerSelection,
        menuDate: orderData.menuDate,
        pdfBlob,
        filename: finalFilename
      });
      
      if (saveResult.success) {
        console.log('=== ZUSÄTZLICH IN DATENBANK GESPEICHERT ===');
      } else {
        console.warn('=== DATENBANK SPEICHERUNG FEHLGESCHLAGEN ===', saveResult.error);
      }
    } catch (dbError) {
      console.warn('=== DATENBANK FEHLER (DOWNLOAD TROTZDEM ERFOLGREICH) ===', dbError);
    }
    
    console.log('=== DOWNLOAD ERFOLGREICH GESTARTET ===');
    
  } catch (error) {
    console.error('=== DOWNLOAD FEHLER ===', error);
    throw new Error(`Download fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
};
