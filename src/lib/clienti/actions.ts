"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema, emptyToNull, type ClienteInput } from "@/lib/validation/cliente-schema";
import { geocodeOrLog } from "@/lib/geocoding/nominatim";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fields?: Partial<Record<keyof ClienteInput, string>> };

function fieldErrors(parsed: ReturnType<typeof clienteSchema.safeParse>) {
  if (parsed.success) return undefined;
  const out: Partial<Record<keyof ClienteInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const k = issue.path[0] as keyof ClienteInput | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createCliente(raw: ClienteInput): Promise<ActionResult<{ id: string }>> {
  const profile = await requireProfile();
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };

  const data = emptyToNull(parsed.data);
  const commerciale_id =
    profile.ruolo === "commerciale" ? (data.commerciale_id ?? profile.id) : data.commerciale_id ?? null;

  let { lat, lng } = data;
  if ((lat == null || lng == null) && data.indirizzo) {
    const r = await geocodeOrLog(String(data.indirizzo));
    if (r) { lat = r.lat; lng = r.lng; }
  }

  const supabase = await createClient();
  const { data: ins, error } = await supabase
    .from("clienti")
    .insert({
      tipo_cliente: data.tipo_cliente,
      nome: data.nome,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      indirizzo: data.indirizzo ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      note: data.note ?? null,
      commerciale_id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/clienti");
  return { ok: true, data: { id: ins!.id } };
}

export async function updateCliente(id: string, raw: ClienteInput): Promise<ActionResult> {
  await requireProfile();
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dati non validi", fields: fieldErrors(parsed) };

  const data = emptyToNull(parsed.data);
  let { lat, lng } = data;

  const supabase = await createClient();
  if ((lat == null || lng == null) && data.indirizzo) {
    const { data: existing } = await supabase
      .from("clienti")
      .select("indirizzo")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.indirizzo !== data.indirizzo) {
      const r = await geocodeOrLog(String(data.indirizzo));
      if (r) { lat = r.lat; lng = r.lng; }
    }
  }

  const { error } = await supabase
    .from("clienti")
    .update({
      tipo_cliente: data.tipo_cliente,
      nome: data.nome,
      email: data.email ?? null,
      telefono: data.telefono ?? null,
      indirizzo: data.indirizzo ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      note: data.note ?? null,
      commerciale_id: data.commerciale_id ?? null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/clienti");
  revalidatePath(`/clienti/${id}`);
  return { ok: true };
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("clienti").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clienti");
  redirect("/clienti");
}

export async function ricalcolaCoordinate(id: string): Promise<ActionResult<{ lat: number | null; lng: number | null }>> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("clienti").select("indirizzo").eq("id", id).maybeSingle();
  if (!data?.indirizzo) return { ok: false, error: "Indirizzo assente" };
  const r = await geocodeOrLog(String(data.indirizzo));
  await supabase.from("clienti").update({ lat: r?.lat ?? null, lng: r?.lng ?? null }).eq("id", id);
  revalidatePath(`/clienti/${id}`);
  return { ok: true, data: { lat: r?.lat ?? null, lng: r?.lng ?? null } };
}
