"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fornitoreSchema, type FornitoreInput } from "@/lib/validation/fornitore-schema";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof FornitoreInput, string>> };

export async function createFornitore(raw: FornitoreInput): Promise<ActionResult<{ id: string }>> {
  await requireRole("admin");
  const parsed = fornitoreSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Partial<Record<keyof FornitoreInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof FornitoreInput | undefined;
      if (k && !fields[k]) fields[k] = issue.message;
    }
    return { ok: false, error: "Dati non validi", fields };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornitori")
    .insert({
      nome: parsed.data.nome,
      contatti: parsed.data.contatti ?? null,
      note: parsed.data.note || null,
      attivo: parsed.data.attivo,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  return { ok: true, data: { id: data!.id } };
}

export async function updateFornitore(id: string, raw: FornitoreInput): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = fornitoreSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("fornitori")
    .update({
      nome: parsed.data.nome,
      contatti: parsed.data.contatti ?? null,
      note: parsed.data.note || null,
      attivo: parsed.data.attivo,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  revalidatePath(`/fornitori/${id}`);
  return { ok: true };
}

export async function deleteFornitore(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("fornitori").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fornitori");
  redirect("/fornitori");
}
