// src/lib/documenti/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Documento, TipoDocumento } from "@/lib/supabase/types";

export type DocumentiFilter = {
  cliente_id?: string;
  tipo?: TipoDocumento;
  in_scadenza_entro?: 60 | 30 | 15 | 0;
};

export async function listDocumenti(filter: DocumentiFilter = {}): Promise<Documento[]> {
  const supabase = await createClient();
  let q = supabase.from("documenti").select("*").order("created_at", { ascending: false });
  if (filter.cliente_id) q = q.eq("cliente_id", filter.cliente_id);
  if (filter.tipo) q = q.eq("tipo", filter.tipo);
  if (filter.in_scadenza_entro != null) {
    const today = new Date();
    const limit = new Date(today.getTime() + filter.in_scadenza_entro * 24 * 60 * 60 * 1000);
    q = q.not("data_scadenza", "is", null);
    q = q.gte("data_scadenza", today.toISOString().slice(0, 10));
    q = q.lte("data_scadenza", limit.toISOString().slice(0, 10));
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getDocumento(id: string): Promise<Documento | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("documenti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
