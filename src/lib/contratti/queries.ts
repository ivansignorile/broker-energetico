// src/lib/contratti/queries.ts
import { createClient } from "@/lib/supabase/server";
import type { Contratto } from "@/lib/supabase/types";

export type ContrattiFilter = {
  q?: string;
  cliente_id?: string;
  fornitore_id?: string;
  stato?: "bozza" | "attivo" | "scaduto" | "rinnovato" | "annullato";
  in_scadenza_entro?: 60 | 30 | 15 | 0;
};

export async function listContratti(filter: ContrattiFilter = {}): Promise<Contratto[]> {
  const supabase = await createClient();
  let q = supabase.from("contratti").select("*").order("data_scadenza", { ascending: true });

  if (filter.cliente_id) q = q.eq("cliente_id", filter.cliente_id);
  if (filter.fornitore_id) q = q.eq("fornitore_id", filter.fornitore_id);
  if (filter.stato) q = q.eq("stato", filter.stato);
  if (filter.in_scadenza_entro != null) {
    const today = new Date();
    const limit = new Date(today.getTime() + filter.in_scadenza_entro * 24 * 60 * 60 * 1000);
    q = q.gte("data_scadenza", today.toISOString().slice(0, 10));
    q = q.lte("data_scadenza", limit.toISOString().slice(0, 10));
    q = q.eq("stato", "attivo");
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getContratto(id: string): Promise<Contratto | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("contratti").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getStoricoRinnovi(id: string): Promise<Contratto[]> {
  const supabase = await createClient();
  // Trova catena: contratti che puntano a questo (sostituiti) + contratti puntati da questo
  const { data: predecessori } = await supabase.from("contratti").select("*").eq("replaced_by_id", id);
  return predecessori ?? [];
}
