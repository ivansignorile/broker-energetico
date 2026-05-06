import { z } from "zod";

export const invitoSchema = z.object({
  email: z.string().email("Email non valida"),
  nome_completo: z.string().min(2, "Nome troppo corto"),
  ruolo: z.enum(["admin", "commerciale", "operatore"]),
});

export type InvitoInput = z.infer<typeof invitoSchema>;
