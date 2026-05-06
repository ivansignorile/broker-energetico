import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/supabase/types";

export type ClientiFilter = {
  q?: string;
  tipo?: "privato" | "azienda";
  commerciale_id?: string;
};

export async function listClienti(filter: ClientiFilter = {}): Promise<Cliente[]> {
  const supabase = await createClient();
  let query = supabase.from("clienti").select("*").order("created_at", { ascending: false });

  if (filter.tipo) query = query.eq("tipo_cliente", filter.tipo);
  if (filter.commerciale_id) query = query.eq("commerciale_id", filter.commerciale_id);
  if (filter.q && filter.q.trim().length >= 2) {
    const q = filter.q.trim();
    query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("clienti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
