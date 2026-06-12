// @ts-nocheck

import { supabase } from '@/integrations/supabase/client';

interface MenuCardData {
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
  pdfBlob: Blob;
  filename: string;
}

export const saveMenuCardToDatabase = async (data: MenuCardData) => {
  try {
    console.log('=== DATENBANK SPEICHERUNG START ===', data.filename);
    
    // Validierung der erforderlichen Daten
    if (!data.pdfBlob || data.pdfBlob.size === 0) {
      throw new Error('PDF-Daten sind leer oder ungültig');
    }
    
    // Convert Blob to Base64 string
    console.log('=== BLOB ZU BASE64 KONVERTIERUNG ===');
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der PDF-Datei'));
      reader.readAsDataURL(data.pdfBlob);
    });
    
    console.log('=== KONVERTIERUNG ABGESCHLOSSEN ===', 'Original Size:', data.pdfBlob.size, 'Base64 Length:', base64String.length);
    
    const insertData = {
      guest_name: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
      guest_company: data.personalInfo.company,
      conference_room: data.personalInfo.conferenceRoom,
      guest_type: data.guestType,
      menu_date: data.menuDate,
      lunch_selection: data.lunchSelection,
      dinner_selection: data.dinnerSelection || null,
      pdf_blob: base64String,
      filename: data.filename
    };
    
    console.log('=== DATENBANK INSERT ===', 'Guest:', insertData.guest_name, 'Filename:', insertData.filename);
    
    const { data: insertResult, error } = await supabase
      .from('generated_menu_cards')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('=== DATENBANK FEHLER ===', error);
      return { success: false, error: `Datenbank-Fehler: ${error.message}` };
    }

    console.log('=== SPEICHERUNG ERFOLGREICH ===', insertResult?.id);
    return { success: true, data: insertResult };
  } catch (error) {
    console.error('=== UNERWARTETER SPEICHER-FEHLER ===', error);
    return { 
      success: false, 
      error: `Speichern fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
};

export const getStoredMenuCards = async (searchQuery?: string) => {
  try {
    console.log('=== LADE GESPEICHERTE MENÜKARTEN ===', searchQuery ? `Suche: ${searchQuery}` : 'Alle');
    
    let query = supabase
      .from('generated_menu_cards')
      .select('*')
      .order('created_at', { ascending: false });

    // Add search functionality
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query = query.or(`guest_name.ilike.${searchTerm},guest_company.ilike.${searchTerm},conference_room.ilike.${searchTerm},filename.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('=== LADE-FEHLER ===', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log('=== LADEN ERFOLGREICH ===', data?.length || 0, 'Einträge');
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('=== UNERWARTETER LADE-FEHLER ===', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler', data: [] };
  }
};

export const downloadStoredMenuCard = async (id: string) => {
  try {
    console.log('=== DOWNLOAD GESPEICHERTE MENÜKARTE ===', id);
    
    const { data, error } = await supabase
      .from('generated_menu_cards')
      .select('pdf_blob, filename')
      .eq('id', id)
      .single();

    if (error) {
      console.error('=== DOWNLOAD LADE-FEHLER ===', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.pdf_blob) {
      return { success: false, error: 'Menükarte nicht gefunden oder PDF-Daten fehlen' };
    }

    // Convert Base64 string back to Blob
    console.log('=== BASE64 ZU BLOB KONVERTIERUNG ===');
    try {
      // Clean the base64 string - remove any whitespace and ensure proper padding
      let cleanBase64 = data.pdf_blob.trim().replace(/\s/g, '');
      
      // Add padding if needed
      while (cleanBase64.length % 4 !== 0) {
        cleanBase64 += '=';
      }
      
      console.log('=== BASE64 BEREINIGT ===', 'Original Length:', data.pdf_blob.length, 'Clean Length:', cleanBase64.length);
      
      // Decode base64 to binary string
      const binaryString = atob(cleanBase64);
      
      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob with correct MIME type
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      console.log('=== BLOB ERSTELLT ===', 'Größe:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Konvertierte PDF ist leer');
      }
      
      // Create download link immediately
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      console.log('=== DOWNLOAD GESTARTET ===', data.filename);
      return { success: true };
      
    } catch (conversionError) {
      console.error('=== KONVERTIERUNG FEHLGESCHLAGEN ===', conversionError);
      return { success: false, error: `Fehler beim Konvertieren der PDF-Daten: ${conversionError instanceof Error ? conversionError.message : 'Unbekannter Konvertierungsfehler'}` };
    }

  } catch (error) {
    console.error('=== DOWNLOAD FEHLER ===', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Download-Fehler' };
  }
};

export const deleteStoredMenuCard = async (id: string) => {
  try {
    console.log('=== LÖSCHE MENÜKARTE ===', id);
    
    const { error } = await supabase
      .from('generated_menu_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('=== LÖSCH-FEHLER ===', error);
      return { success: false, error: error.message };
    }

    console.log('=== LÖSCHEN ERFOLGREICH ===');
    return { success: true };
  } catch (error) {
    console.error('=== UNERWARTETER LÖSCH-FEHLER ===', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
};
