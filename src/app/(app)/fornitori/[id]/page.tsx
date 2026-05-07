import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreDeleteButton } from "@/components/fornitori/FornitoreDeleteButton";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  const c = (f.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {};

  const statoStyle = f.attivo
    ? { bg: "var(--cohere-pale-green)", fg: "var(--cohere-deep-green)" }
    : { bg: "transparent", fg: "var(--cohere-muted)", ring: "var(--cohere-hairline)" };

  return (
    <div className="space-y-8">
      <PageHeader
        area="Anagrafica · Fornitore"
        title={f.nome}
        meta={
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: statoStyle.bg,
              color: statoStyle.fg,
              boxShadow: statoStyle.ring ? `inset 0 0 0 1px ${statoStyle.ring}` : undefined,
            }}
          >
            {f.attivo ? "Attivo" : "Disattivato"}
          </span>
        }
        actions={
          isAdmin(profile) ? (
            <>
              <Button variant="outline" render={<Link href={`/fornitori/${f.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
              <FornitoreDeleteButton id={f.id} nome={f.nome} />
            </>
          ) : null
        }
      />
      <Card>
        <CardHeader><CardTitle>Contatti</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Referente" value={c.referente} />
          <Row label="Email" value={c.email} />
          <Row label="Telefono" value={c.telefono} />
          <Row label="Note" value={f.note} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}
