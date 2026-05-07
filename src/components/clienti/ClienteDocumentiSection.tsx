// src/components/clienti/ClienteDocumentiSection.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDocumenti } from "@/lib/documenti/queries";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";

export async function ClienteDocumentiSection({ clienteId }: { clienteId: string }) {
  const docs = await listDocumenti({ cliente_id: clienteId });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Documenti ({docs.length})</CardTitle>
        <Button size="sm" render={<Link href={`/clienti/${clienteId}/documenti/nuovo`}><Plus className="mr-2 h-4 w-4" /> Carica</Link>} />
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun documento.</p>
        ) : (
          <ul className="divide-y">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/documenti/${d.id}/modifica`} className="hover:underline capitalize">
                  {d.tipo.replace(/_/g, " ")} {d.descrizione ? `· ${d.descrizione}` : ""}
                </Link>
                {d.data_scadenza && <ScadenzaBadge data={d.data_scadenza} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
