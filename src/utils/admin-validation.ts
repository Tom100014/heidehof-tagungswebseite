/**
 * admin-validation.ts
 * Zentrale Zod-Schemas für Admin-Formulare.
 * Liefert benutzerfreundliche deutsche Fehlermeldungen.
 */
import { z } from "zod";

const optionalNumber = (min?: number, max?: number) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    })
    .refine((n) => n === null || (min === undefined || n >= min), {
      message: `Wert muss ≥ ${min} sein`,
    })
    .refine((n) => n === null || (max === undefined || n <= max), {
      message: `Wert muss ≤ ${max} sein`,
    });

export const roomSchema = z.object({
  name: z.string().trim().min(2, "Name muss mind. 2 Zeichen haben").max(80, "Max. 80 Zeichen"),
  subtitle: z.string().trim().max(120).optional().nullable(),
  category: z.enum(["tagungscenter", "art-center"]),
  capacity: z.coerce.number().int().min(1, "Mind. 1 Person").max(2000, "Max. 2000 Personen"),
  description: z.string().trim().max(2000).optional().nullable(),
  style: z.string().trim().max(40).optional().nullable(),
  equipment: z.array(z.string()).max(40).default([]),
  length_m: optionalNumber(0, 200),
  width_m: optionalNumber(0, 200),
  height_m: optionalNumber(0, 30),
  area_sqm: optionalNumber(0, 10000),
  cap_theater: optionalNumber(0, 5000),
  cap_parlament: optionalNumber(0, 5000),
  cap_uform: optionalNumber(0, 5000),
  cap_block: optionalNumber(0, 5000),
  cap_bankett: optionalNumber(0, 5000),
});

export const dishSchema = z.object({
  title: z.string().trim().min(2, "Titel zu kurz").max(120, "Max. 120 Zeichen"),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(1, "Kategorie wählen"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("lunch"),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum"),
});

export const partnerSchema = z.object({
  name: z.string().trim().min(2, "Name zu kurz").max(80),
  target_url: z.string().trim().url("Ungültige URL").max(500),
  logo_url: z.string().trim().url("Ungültige Logo-URL").max(1000),
});

export const knowledgeSchema = z.object({
  title: z.string().trim().min(2, "Titel zu kurz").max(200),
  category: z.string().trim().min(1, "Kategorie erforderlich").max(60),
  content: z.string().trim().min(3, "Inhalt zu kurz").max(20000, "Max. 20.000 Zeichen"),
});

/**
 * Helper: validiert Daten und gibt entweder geparste Daten oder einen
 * formatierten Fehlerstring (erste Fehlermeldung) zurück.
 */
export function validateOrError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const first = res.error.issues[0];
  const path = first.path.length ? `${first.path.join(".")}: ` : "";
  return { ok: false, error: `${path}${first.message}` };
}
