/**
 * Delivery Time Calculator
 * Berechnet Zubereitungs- und Lieferzeiten für Bestellungen
 */

export interface OrderItem {
  preparation_time_minutes?: number;
  quantity: number;
  name?: string;
}

/**
 * Berechnet die Gesamt-Zubereitungszeit basierend auf Items
 * Logik: Längste Einzelzeit + Buffer für mehrere Items
 */
export const calculateTotalPrepTime = (items: OrderItem[]): number => {
  if (!items || items.length === 0) return 15; // Default 15 Min.
  
  // Finde die längste Zubereitungszeit
  const maxPrepTime = Math.max(
    ...items.map(item => item.preparation_time_minutes || 5)
  );
  
  // Zähle Gesamtanzahl Items
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Base time + extra time per additional item (parallel prep möglich)
  // Beispiel: 1 Item = 5min, 2 Items = 7min, 3 Items = 9min
  const bufferTime = totalItemCount > 1 ? (totalItemCount - 1) * 2 : 0;
  
  return Math.max(maxPrepTime + bufferTime, 5); // Minimum 5 Minuten
};

/**
 * Berechnet die voraussichtliche Lieferzeit als formatierte Uhrzeit
 */
export const calculateDeliveryTime = (
  orderTime: string | Date, 
  items: OrderItem[]
): string => {
  const prepTime = calculateTotalPrepTime(items);
  const deliveryTime = new Date(orderTime);
  deliveryTime.setMinutes(deliveryTime.getMinutes() + prepTime);
  
  return deliveryTime.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Gibt eine vollständige Lieferzeit-Schätzung zurück
 * Format: "ca. 15 Min. (bis 14:30 Uhr)"
 */
export const getDeliveryEstimate = (
  orderTime: string | Date, 
  items: OrderItem[]
): string => {
  const prepTime = calculateTotalPrepTime(items);
  const deliveryTime = calculateDeliveryTime(orderTime, items);
  
  return `ca. ${prepTime} Min. (bis ${deliveryTime} Uhr)`;
};

/**
 * Prüft ob eine Bestellung "Express" ist (< 5 Min)
 */
export const isExpressOrder = (items: OrderItem[]): boolean => {
  return calculateTotalPrepTime(items) <= 5;
};

/**
 * Gibt eine Kategorie der Zubereitungszeit zurück
 */
export const getPrepTimeCategory = (items: OrderItem[]): 'schnell' | 'normal' | 'länger' => {
  const time = calculateTotalPrepTime(items);
  
  if (time <= 5) return 'schnell';
  if (time <= 15) return 'normal';
  return 'länger';
};
