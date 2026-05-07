import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCliente } from "@/lib/clienti/queries";
import { ClienteMappa } from "@/components/clienti/ClienteMappa";
import { ClienteDeleteButton } from "@/components/clienti/ClienteDeleteButton";
import { ClienteContrattiSection } from "@/components/clienti/ClienteContrattiSection";
import { ClienteDocumentiSection } from "@/components/clienti/ClienteDocumentiSection";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const supabase = await createClient();
  const { data: fornitori } = await supabase.from("fornitori").select("id, nome");
  const fornitoriMap = new Map((fornitori ?? []).map((f) => [f.id, f.nome]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
          <Badge variant={cliente.tipo_cliente === "azienda" ? "default" : "secondary"} className="mt-1 capitalize">
            {cliente.tipo_cliente}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clienti/${cliente.id}/modifica`}><Pencil className="mr-2 h-4 w-4" /> Modifica</Link>} />
          {isAdmin(profile) && <ClienteDeleteButton id={cliente.id} nome={cliente.nome} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value={cliente.email} />
            <Row label="Telefono" value={cliente.telefono} />
            <Row label="Indirizzo" value={cliente.indirizzo} />
            <Row label="Note" value={cliente.note} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mappa</CardTitle></CardHeader>
          <CardContent>
            <ClienteMappa lat={cliente.lat} lng={cliente.lng} label={cliente.nome} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ClienteContrattiSection clienteId={cliente.id} fornitoriMap={fornitoriMap} />
        <ClienteDocumentiSection clienteId={cliente.id} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}
