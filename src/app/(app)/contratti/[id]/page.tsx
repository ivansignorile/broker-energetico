import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getContratto, getStoricoRinnovi } from "@/lib/contratti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";
import { ContrattoDeleteButton } from "@/components/contratti/ContrattoDeleteButton";
import { RinnovaContrattoButton } from "@/components/contratti/RinnovaContrattoButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { getContrattoAllegatoUrl } from "@/lib/documenti/actions";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const c = await getContratto(id);
  if (!c) notFound();

  const supabase = await createClient();
  const [{ data: cliente }, { data: fornitore }, predecessori] = await Promise.all([
    supabase.from("clienti").select("id, nome").eq("id", c.cliente_id).maybeSingle(),
    supabase.from("fornitori").select("id, nome").eq("id", c.fornitore_id).maybeSingle(),
    getStoricoRinnovi(c.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        area={`Contratto · ${cliente?.nome ?? "?"}`}
        title={`${fornitore?.nome ?? "?"} · ${c.tipo}`}
        meta={
          <span className="flex items-center gap-2">
            <ContrattoStatoBadge stato={c.stato} />
            {c.stato === "attivo" && <ScadenzaBadge data={c.data_scadenza} />}
          </span>
        }
        actions={
          <>
            <Button variant="outline" render={<Link href={`/contratti/${c.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
            {c.stato === "attivo" && (
              <RinnovaContrattoButton id={c.id} defaultStart={c.data_scadenza} defaultEnd={addYear(c.data_scadenza)} />
            )}
            {isAdmin(profile) && <ContrattoDeleteButton id={c.id} />}
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Anagrafica contratto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Cliente" value={cliente ? <Link href={`/clienti/${cliente.id}`} className="hover:underline">{cliente.nome}</Link> : "—"} />
            <Row label="Fornitore" value={fornitore?.nome ?? "—"} />
            <Row label="Categoria" value={c.categoria} />
            <Row label="Tipo" value={c.tipo} />
            <Row label="Mercato" value={c.mercato ?? "—"} />
            {c.pod && <Row label="POD" value={c.pod} />}
            {c.pdr && <Row label="PDR" value={c.pdr} />}
            <Row label="Data inizio" value={c.data_inizio} />
            <Row label="Data scadenza" value={c.data_scadenza} />
            <Row label="Note" value={c.note ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Allegato e storico</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {c.allegato_path
              ? <PdfDownloadButton getUrl={() => getContrattoAllegatoUrl(c.id)} label="Scarica contratto" />
              : <p className="text-muted-foreground">Nessun allegato.</p>}
            {predecessori.length > 0 && (
              <div>
                <p className="font-medium">Contratti precedenti:</p>
                <ul className="list-disc pl-5">
                  {predecessori.map((p) => (
                    <li key={p.id}>
                      <Link href={`/contratti/${p.id}`} className="hover:underline">{p.data_inizio} → {p.data_scadenza}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.replaced_by_id && (
              <p className="text-sm">
                Sostituito da: <Link href={`/contratti/${c.replaced_by_id}`} className="hover:underline">apri rinnovo</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="col-span-2">{value}</span>
    </div>
  );
}

function addYear(iso: string): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
