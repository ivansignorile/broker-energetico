import { Folder } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listDocumenti, type DocumentiFilter } from "@/lib/documenti/queries";
import { DocumentiTable } from "@/components/documenti/DocumentiTable";
import { DocumentiFilterBar } from "@/components/documenti/DocumentiFilterBar";
import { TIPO_DOCUMENTO, type DocumentoInput } from "@/lib/validation/documento-schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const entro = sp.entro ? Number(sp.entro) : undefined;
  const tipoRaw = sp.tipo;
  const tipo = tipoRaw && (TIPO_DOCUMENTO as readonly string[]).includes(tipoRaw)
    ? (tipoRaw as DocumentoInput["tipo"])
    : undefined;
  const filter: DocumentiFilter = {
    cliente_id: sp.cliente_id,
    tipo,
    in_scadenza_entro: (entro === 0 || entro === 15 || entro === 30 || entro === 60) ? entro : undefined,
  };
  const hasFilters = !!(filter.cliente_id || filter.tipo || filter.in_scadenza_entro != null);

  const supabase = await createClient();
  const [documenti, clientiRes] = await Promise.all([
    listDocumenti(filter),
    supabase.from("clienti").select("id, nome").order("nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const rows = documenti.map((d) => ({ ...d, cliente_nome: clientiMap.get(d.cliente_id) ?? null }));

  return (
    <div className="space-y-8">
      <PageHeader
        area="Operatività"
        title="Documenti"
        subtitle="Documenti collegati ai clienti. Si caricano dalla scheda del cliente."
      />
      <DocumentiFilterBar />
      {rows.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={hasFilters ? "Nessun documento trovato" : "Ancora nessun documento"}
          description={
            hasFilters
              ? "Allarga i filtri o azzerali per vedere tutti i documenti."
              : "Apri la scheda di un cliente e carica il primo documento (es. carta d'identità)."
          }
        />
      ) : (
        <DocumentiTable rows={rows} />
      )}
    </div>
  );
}
