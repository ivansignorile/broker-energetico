"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { invitoSchema, type InvitoInput } from "@/lib/validation/invito-schema";

export type InvitoResult =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<keyof InvitoInput, string>> };

export async function invitaUtente(input: InvitoInput): Promise<InvitoResult> {
  await requireRole("admin");

  const parsed = invitoSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Partial<Record<keyof InvitoInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof InvitoInput;
      if (k && !fields[k]) fields[k] = issue.message;
    }
    return { ok: false, error: "Dati non validi", fields };
  }

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      ruolo: parsed.data.ruolo,
      nome_completo: parsed.data.nome_completo,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/utenti");
  return { ok: true };
}
