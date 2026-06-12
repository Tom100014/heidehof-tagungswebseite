/**
 * Robuster WhatsApp-Öffner für alle Geräte und Browser
 */

export interface WhatsAppOpenResult {
  success: boolean;
  method: string;
  error?: string;
}

export const openWhatsAppRobust = (phoneNumber: string, message: string, preOpenedWindow?: Window | null): Promise<WhatsAppOpenResult> => {
  return new Promise((resolve) => {
    // Bereite die URL vor (ohne + für WhatsApp)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    console.log('🚀 Öffne WhatsApp mit URL:', whatsappUrl);
    
    // Falls ein vorab geöffnetes Fenster vorhanden ist, navigiere darin
    if (preOpenedWindow && !preOpenedWindow.closed) {
      try {
        preOpenedWindow.location.href = whatsappUrl;
        console.log('✅ WhatsApp über vorab geöffnetes Fenster navigiert');
        resolve({ success: true, method: 'preopened_window' });
        return;
      } catch (error) {
        console.warn('❌ Navigation im vorab geöffneten Fenster fehlgeschlagen:', error);
      }
    }
    
    // Methode 1: Versuche window.open mit _blank
    try {
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow && !newWindow.closed) {
        console.log('✅ WhatsApp mit window.open(_blank) geöffnet');
        resolve({ success: true, method: 'window.open(_blank)' });
        return;
      }
    } catch (error) {
      console.warn('❌ window.open(_blank) fehlgeschlagen:', error);
    }
    
    // Methode 2: Versuche window.open mit _self
    try {
      window.open(whatsappUrl, '_self');
      console.log('✅ WhatsApp mit window.open(_self) geöffnet');
      resolve({ success: true, method: 'window.open(_self)' });
      return;
    } catch (error) {
      console.warn('❌ window.open(_self) fehlgeschlagen:', error);
    }
    
    // Methode 3: Versuche location.href
    try {
      window.location.href = whatsappUrl;
      console.log('✅ WhatsApp mit location.href geöffnet');
      resolve({ success: true, method: 'location.href' });
      return;
    } catch (error) {
      console.warn('❌ location.href fehlgeschlagen:', error);
    }
    
    // Methode 4: Erstelle einen unsichtbaren Link und klicke darauf
    try {
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ WhatsApp mit Link-Click geöffnet');
      resolve({ success: true, method: 'link.click()' });
      return;
    } catch (error) {
      console.warn('❌ Link-Click fehlgeschlagen:', error);
    }
    
    // Alle Methoden fehlgeschlagen
    console.error('❌ Alle WhatsApp-Öffnungsversuche fehlgeschlagen');
    resolve({ 
      success: false, 
      method: 'none', 
      error: 'Alle Öffnungsversuche fehlgeschlagen' 
    });
  });
};

export const openSMSRobust = (phoneNumber: string, message: string, preOpenedWindow?: Window | null): Promise<WhatsAppOpenResult> => {
  return new Promise((resolve) => {
    // SMS benötigt + vor der Nummer und darf keine Leerzeichen/Sonderzeichen enthalten
    const digitsOnly = phoneNumber.replace(/[^0-9+]/g, '');
    const cleanNumber = digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly.replace(/[^0-9]/g, '')}`;
    const encodedMessage = encodeURIComponent(message);
    const smsUrl = `sms:${cleanNumber}?body=${encodedMessage}`;
    
    console.log('📱 Öffne SMS mit URL:', smsUrl);
    
    // Falls ein vorab geöffnetes Fenster vorhanden ist, navigiere darin
    if (preOpenedWindow && !preOpenedWindow.closed) {
      try {
        preOpenedWindow.location.href = smsUrl;
        console.log('✅ SMS über vorab geöffnetes Fenster navigiert');
        resolve({ success: true, method: 'preopened_window' });
        return;
      } catch (error) {
        console.warn('❌ Navigation im vorab geöffneten Fenster fehlgeschlagen:', error);
      }
    }
    
    // Methode 1: window.location.href (am besten für SMS)
    try {
      window.location.href = smsUrl;
      console.log('✅ SMS mit location.href geöffnet');
      resolve({ success: true, method: 'location.href' });
      return;
    } catch (error) {
      console.warn('❌ SMS location.href fehlgeschlagen:', error);
    }
    
    // Methode 2: window.open
    try {
      window.open(smsUrl, '_self');
      console.log('✅ SMS mit window.open geöffnet');
      resolve({ success: true, method: 'window.open' });
      return;
    } catch (error) {
      console.warn('❌ SMS window.open fehlgeschlagen:', error);
    }
    
    // Fehlgeschlagen
    resolve({ 
      success: false, 
      method: 'none', 
      error: 'SMS-Öffnung fehlgeschlagen' 
    });
  });
};