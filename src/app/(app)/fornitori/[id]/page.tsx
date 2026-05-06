import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreDeleteButton } from "@/components/fornitori/FornitoreDeleteButton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  const c = (f.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{f.nome}</h1>
          <Badge variant={f.attivo ? "secondary" : "outline"} className="mt-1">{f.attivo ? "Attivo" : "Disattivato"}</Badge>
        </div>
        {isAdmin(profile) && (
          <div className="flex items-center gap-2">
            <Button variant="outline" render={<Link href={`/fornitori/${f.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
            <FornitoreDeleteButton id={f.id} nome={f.nome} />
          </div>
        )}
      </div>
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
