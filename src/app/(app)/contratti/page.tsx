// src/app/(app)/contratti/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listContratti, type ContrattiFilter } from "@/lib/contratti/queries";
import { ContrattiTable } from "@/components/contratti/ContrattiTable";
import { ContrattiFilters } from "@/components/contratti/ContrattiFilters";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const entro = sp.entro ? Number(sp.entro) : undefined;
  const filter: ContrattiFilter = {
    cliente_id: sp.cliente_id,
    fornitore_id: sp.fornitore_id,
    stato: sp.stato as ContrattiFilter["stato"],
    in_scadenza_entro: (entro === 0 || entro === 15 || entro === 30 || entro === 60) ? entro : undefined,
  };

  const supabase = await createClient();
  const [contratti, clientiRes, fornitoriRes] = await Promise.all([
    listContratti(filter),
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").order("nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const fornitoriMap = new Map((fornitoriRes.data ?? []).map((f) => [f.id, f.nome]));
  const rows = contratti.map((c) => ({
    ...c,
    cliente_nome: clientiMap.get(c.cliente_id) ?? null,
    fornitore_nome: fornitoriMap.get(c.fornitore_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contratti</h1>
        <Button render={<Link href="/contratti/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo contratto</Link>} />
      </div>
      <ContrattiFilters clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} />
      <ContrattiTable rows={rows} />
    </div>
  );
}
