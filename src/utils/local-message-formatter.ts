// Einfache lokale KI-Formatierung ohne Edge Function
export const formatMessageProfessionally = (originalMessage: string, customerName?: string): string => {
  const greetings = [
    "Sehr gerne!",
    "Vielen Dank!",
    "Gerne!",
    "Selbstverständlich!"
  ];
  
  const closings = [
    "Mit freundlichen Grüßen\nIhr Hotel-Team",
    "Herzliche Grüße\nIhr Hotel Der Heidehof Team",
    "Mit besten Grüßen\nIhr Hotel-Team"
  ];

  // Einfache Keyword-basierte Formatierung
  const message = originalMessage.toLowerCase().trim();
  
  let professionalMessage = "";
  
  if (message.includes("ok") || message.includes("mache") || message.includes("wird gemacht")) {
    professionalMessage = `${greetings[0]} Wir kümmern uns umgehend darum. Vielen Dank für Ihr Verständnis.`;
  }
  else if (message.includes("danke") || message.includes("bestellung") || message.includes("menübestellung") || message.includes("conference_order")) {
    professionalMessage = `${greetings[1]} Ihre Menübestellung wurde erfolgreich entgegengenommen und wird umgehend an unser Küchenteam weitergeleitet. Sie erhalten in Kürze eine Bestätigung.`;
  }
  else if (message.includes("kommt") || message.includes("minuten") || message.includes("essen")) {
    professionalMessage = `${greetings[1]} Ihre Menübestellung wurde erfolgreich entgegengenommen und wird umgehend an unser Küchenteam weitergeleitet. Sie erhalten in Kürze eine Bestätigung.`;
  }
  else if (message.includes("fertig") || message.includes("bereit")) {
    professionalMessage = `${greetings[3]} Alles ist für Sie vorbereitet. Sie können sich gerne melden, falls Sie weitere Unterstützung benötigen.`;
  }
  else {
    // Fallback für andere Nachrichten
    professionalMessage = `${greetings[2]} Wir haben Ihre Nachricht erhalten und kümmern uns darum.`;
  }
  
  // Füge persönliche Anrede hinzu falls Name vorhanden
  if (customerName && customerName !== "Kunde" && customerName !== "Unbekannt") {
    professionalMessage = `Liebe/r ${customerName},\n\n${professionalMessage}`;
  }
  
  return `${professionalMessage}\n\n${closings[0]}`;
};