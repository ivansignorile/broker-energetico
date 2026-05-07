import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listContratti, type ContrattiFilter } from "@/lib/contratti/queries";
import { ContrattiTable } from "@/components/contratti/ContrattiTable";
import { ContrattiFilters } from "@/components/contratti/ContrattiFilters";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

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
  const hasFilters = !!(filter.cliente_id || filter.fornitore_id || filter.stato || filter.in_scadenza_entro != null);

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
    <div className="space-y-8">
      <PageHeader
        area="Operatività"
        title="Contratti"
        subtitle={`${rows.length} ${rows.length === 1 ? "contratto" : "contratti"} ${hasFilters ? "con i filtri attivi" : "in totale"}.`}
        actions={
          <Button render={<Link href="/contratti/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo contratto</Link>} />
        }
      />
      <ContrattiFilters clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} />
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "Nessun contratto trovato" : "Ancora nessun contratto"}
          description={
            hasFilters
              ? "Prova ad allargare i filtri."
              : "Apri la scheda di un cliente e crea il primo contratto."
          }
        />
      ) : (
        <ContrattiTable rows={rows} />
      )}
    </div>
  );
}
