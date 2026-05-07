// src/components/clienti/ClienteContrattiSection.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listContratti } from "@/lib/contratti/queries";
import { ContrattoStatoBadge } from "@/components/contratti/ContrattoStatoBadge";
import { ScadenzaBadge } from "@/components/shared/ScadenzaBadge";

export async function ClienteContrattiSection({ clienteId, fornitoriMap }: { clienteId: string; fornitoriMap: Map<string, string> }) {
  const contratti = await listContratti({ cliente_id: clienteId });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Contratti ({contratti.length})</CardTitle>
        <Button size="sm" render={<Link href={`/contratti/nuovo?cliente=${clienteId}`}><Plus className="mr-2 h-4 w-4" /> Nuovo</Link>} />
      </CardHeader>
      <CardContent>
        {contratti.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun contratto.</p>
        ) : (
          <ul className="divide-y">
            {contratti.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/contratti/${c.id}`} className="hover:underline">
                  {fornitoriMap.get(c.fornitore_id) ?? "?"} · <span className="capitalize">{c.tipo}</span> · {c.data_scadenza}
                </Link>
                <div className="flex items-center gap-2">
                  <ContrattoStatoBadge stato={c.stato} />
                  {c.stato === "attivo" && <ScadenzaBadge data={c.data_scadenza} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
