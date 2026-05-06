import { createClient } from "@/lib/supabase/server";
import type { Fornitore } from "@/lib/supabase/types";

export async function listFornitori(): Promise<Fornitore[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fornitori").select("*").order("nome");
  return data ?? [];
}

export async function getFornitore(id: string): Promise<Fornitore | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("fornitori").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
