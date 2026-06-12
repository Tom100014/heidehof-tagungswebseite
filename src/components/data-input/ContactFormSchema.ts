
import * as z from "zod";
import { ValidationRules } from "@/utils/form-validation";

// Einheitliches Schema basierend auf den neuen Validierungsregeln
export const contactFormSchema = z.object({
  name: ValidationRules.name,
  contactMethod: z.enum(["email", "whatsapp", "sms", "none"]),
  contactValue: z.string(),
  allowFutureContact: z.boolean().default(true),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "Sie müssen die Datenschutzerklärung akzeptieren, um fortfahren zu können."
  }),
  serviceDetails: z.object({
    serviceId: z.string().optional(),
    serviceName: z.string().optional(),
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.string().optional()
    })).optional()
  }).optional(),
  roomNumber: ValidationRules.roomNumber.optional()
}).refine((data) => {
  // Validiere contactValue basierend auf contactMethod
  if (data.contactMethod === "none") return true;
  
  if (data.contactMethod === "email") {
    return ValidationRules.email.safeParse(data.contactValue).success;
  } else if (data.contactMethod === "whatsapp" || data.contactMethod === "sms") {
    return ValidationRules.phone.safeParse(data.contactValue).success;
  }
  
  return true;
}, {
  message: "Bitte geben Sie gültige Kontaktdaten ein.",
  path: ["contactValue"]
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

// Behalte die bestehenden Hilfsfunktionen für Rückwärtskompatibilität
export const validateEmail = (email: string): boolean => {
  return ValidationRules.email.safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  return ValidationRules.phone.safeParse(phone).success;
};

// Verwende die neue Formatierungs-Funktion
export { formatPhoneNumber } from "@/utils/form-validation";
