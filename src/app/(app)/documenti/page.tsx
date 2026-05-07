// src/app/(app)/documenti/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listDocumenti, type DocumentiFilter } from "@/lib/documenti/queries";
import { DocumentiTable } from "@/components/documenti/DocumentiTable";
import { DocumentiFilterBar } from "@/components/documenti/DocumentiFilterBar";
import { TIPO_DOCUMENTO, type DocumentoInput } from "@/lib/validation/documento-schema";

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

  const supabase = await createClient();
  const [documenti, clientiRes] = await Promise.all([
    listDocumenti(filter),
    supabase.from("clienti").select("id, nome").order("nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const rows = documenti.map((d) => ({ ...d, cliente_nome: clientiMap.get(d.cliente_id) ?? null }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documenti</h1>
        <p className="text-sm text-muted-foreground">I documenti si caricano dalla scheda cliente.</p>
      </div>
      <DocumentiFilterBar />
      <DocumentiTable rows={rows} />
    </div>
  );
}
