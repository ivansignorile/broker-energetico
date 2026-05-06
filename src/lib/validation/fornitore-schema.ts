import { z } from "zod";

export const fornitoreSchema = z.object({
  nome: z.string().trim().min(2, "Nome troppo corto").max(200),
  contatti: z.object({
    referente: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Email non valida").optional().or(z.literal("")),
    telefono: z.string().trim().max(40).optional().or(z.literal("")),
  }).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  attivo: z.boolean().default(true),
});

export type FornitoreInput = z.infer<typeof fornitoreSchema>;
