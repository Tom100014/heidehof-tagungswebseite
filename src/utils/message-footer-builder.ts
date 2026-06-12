/**
 * Zentrales System für Footer-Management in allen Nachrichten
 * 
 * WICHTIG: 
 * - Gast → Hotel: KEIN Footer
 * - Hotel → Gast: Hotel Footer + Promotional Footer
 * - Hotel → Admin intern: NUR Hotel Footer (keine Werbung)
 */

import { addHotelFooter } from './hotel-footer';

export interface FooterConfig {
  includePromotional: boolean;
  promotionalFooter?: string;
  hotelFooter?: string;
}

/**
 * Baut eine komplette Nachricht mit korrektem Footer auf
 * 
 * @param baseMessage - Die Basis-Nachricht (ohne Footer)
 * @param config - Footer-Konfiguration
 * @returns Komplette Nachricht mit Footer(n)
 */
export function buildCompleteMessage(
  baseMessage: string, 
  config: FooterConfig
): string {
  let result = baseMessage.trim();
  
  // Promotional Footer (nur wenn includePromotional = true UND vorhanden)
  if (config.includePromotional && config.promotionalFooter) {
    result += `\n\n${config.promotionalFooter.trim()}`;
  }
  
  // Hotel Footer (immer, aber verwende custom wenn vorhanden)
  if (config.hotelFooter) {
    result += `\n\n${config.hotelFooter.trim()}`;
  } else {
    // Fallback auf Standard-Footer
    result = addHotelFooter(result);
  }
  
  return result;
}

/**
 * Default Footer-Config für verschiedene Szenarien
 */
export const FOOTER_CONFIGS = {
  // Gast → Hotel: KEIN Footer
  GUEST_TO_HOTEL: {
    includePromotional: false
  },
  
  // Hotel → Gast: Voller Footer mit Werbung
  HOTEL_TO_GUEST: {
    includePromotional: true
  },
  
  // Hotel → Admin intern: Nur Hotel-Info, keine Werbung
  HOTEL_INTERNAL: {
    includePromotional: false
  }
} as const;

/**
 * Entfernt doppelte Footer aus einer Nachricht (falls vorhanden)
 */
export function removeDuplicateFooters(message: string): string {
  // Entferne mehrfache "---" Trennlinien
  let cleaned = message.replace(/(\n---\n.*?){2,}/g, '\n---\n');
  
  // Entferne mehrfache "Hotel Der Heidehof" Vorkommen
  const hotelPattern = /Hotel Der Heidehof[^]*?(?=Hotel Der Heidehof|$)/gi;
  const matches = message.match(hotelPattern);
  
  if (matches && matches.length > 1) {
    // Behalte nur das erste Vorkommen
    cleaned = message.replace(hotelPattern, '').trim();
    cleaned += '\n\n' + matches[0];
  }
  
  return cleaned;
}
