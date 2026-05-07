// src/components/dashboard/ScadenzeWidget.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listContratti } from "@/lib/contratti/queries";
import { listDocumenti } from "@/lib/documenti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import { giorniAllaScadenza, classificaScadenza } from "@/lib/scadenze/helpers";
import type { Contratto, Documento } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

type ContrattoRow = Contratto & { cliente_nome?: string | null; fornitore_nome?: string | null; giorni: number };
type DocumentoRow = Documento & { cliente_nome?: string | null; giorni: number };

export async function ScadenzeWidget() {
  const supabase = await createClient();
  const [contratti, documenti, clientiRes, fornitoriRes] = await Promise.all([
    listContratti({ in_scadenza_entro: 60 }),
    listDocumenti({ in_scadenza_entro: 60 }),
    supabase.from("clienti").select("id, nome"),
    supabase.from("fornitori").select("id, nome"),
  ]);
  const clientiMap = new Map((clientiRes.data ?? []).map((c) => [c.id, c.nome]));
  const fornitoriMap = new Map((fornitoriRes.data ?? []).map((f) => [f.id, f.nome]));

  const cRows: ContrattoRow[] = contratti.map((c) => ({
    ...c,
    cliente_nome: clientiMap.get(c.cliente_id) ?? null,
    fornitore_nome: fornitoriMap.get(c.fornitore_id) ?? null,
    giorni: giorniAllaScadenza(c.data_scadenza),
  })).sort((a, b) => a.giorni - b.giorni);

  const dRows: DocumentoRow[] = documenti.map((d) => ({
    ...d,
    cliente_nome: clientiMap.get(d.cliente_id) ?? null,
    giorni: d.data_scadenza ? giorniAllaScadenza(d.data_scadenza) : 999,
  })).sort((a, b) => a.giorni - b.giorni);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Contratti in scadenza ({cRows.length})</CardTitle></CardHeader>
        <CardContent>
          {cRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun contratto in scadenza nei prossimi 60 giorni.</p>
          ) : (
            <ul className="divide-y">
              {cRows.slice(0, 12).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/contratti/${c.id}`} className="truncate hover:underline">
                    <span className="font-medium">{c.cliente_nome ?? "?"}</span>
                    <span className="text-muted-foreground"> · {c.fornitore_nome ?? "?"} · {c.tipo}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <ContrattoStatoBadge stato={c.stato} />
                    <ScadenzaBadge data={c.data_scadenza} />
                  </div>
                </li>
              ))}
              {cRows.length > 12 && (
                <li className="pt-2 text-sm">
                  <Link href="/contratti?entro=60" className="text-primary hover:underline">+ {cRows.length - 12} altri →</Link>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Documenti in scadenza ({dRows.length})</CardTitle></CardHeader>
        <CardContent>
          {dRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun documento in scadenza nei prossimi 60 giorni.</p>
          ) : (
            <ul className="divide-y">
              {dRows.slice(0, 12).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/documenti/${d.id}/modifica`} className="truncate hover:underline">
                    <span className="font-medium">{d.cliente_nome ?? "?"}</span>
                    <span className="text-muted-foreground capitalize"> · {d.tipo.replace(/_/g, " ")}</span>
                  </Link>
                  <ScadenzaBadge data={d.data_scadenza} />
                </li>
              ))}
              {dRows.length > 12 && (
                <li className="pt-2 text-sm">
                  <Link href="/documenti?entro=60" className="text-primary hover:underline">+ {dRows.length - 12} altri →</Link>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
