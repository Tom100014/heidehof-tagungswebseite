/**
 * Hotel Heidehof Koordinaten (Gaimersheim bei Ingolstadt)
 */
export const HEIDEHOF_COORDINATES = {
  latitude: 48.7833, // Gaimersheim
  longitude: 11.4167
};

/**
 * Berechnet die Luftlinie-Entfernung zwischen zwei Koordinaten mit der Haversine-Formel
 * @param lat1 Breitengrad der ersten Position
 * @param lon1 Längengrad der ersten Position
 * @param lat2 Breitengrad der zweiten Position
 * @param lon2 Längengrad der zweiten Position
 * @returns Entfernung in Kilometern
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Erdradius in Kilometern
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Auf eine Dezimalstelle runden
}

/**
 * Berechnet die Luftlinie-Entfernung vom Hotel Heidehof zu einem Event
 * @param event Event mit latitude/longitude
 * @returns Formatierte Entfernungsangabe oder null
 */
export function getDistanceFromHeidehof(event: any): string | null {
  if (!event.latitude || !event.longitude) {
    return null;
  }

  const distance = calculateDistance(
    HEIDEHOF_COORDINATES.latitude,
    HEIDEHOF_COORDINATES.longitude,
    event.latitude,
    event.longitude
  );

  // Formatierung je nach Entfernung
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m Luftlinie`;
  } else if (distance < 10) {
    return `${distance} km Luftlinie`;
  } else {
    return `${Math.round(distance)} km Luftlinie`;
  }
}