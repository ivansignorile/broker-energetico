import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Fornitore } from "@/lib/supabase/types";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { Profile } from "@/lib/supabase/types";

export function FornitoriTable({ rows, currentRuolo }: { rows: Fornitore[]; currentRuolo: Profile["ruolo"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Referente</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefono</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nessun fornitore.</TableCell></TableRow>
        )}
        {rows.map((f) => {
          const c = (f.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {};
          return (
            <TableRow key={f.id}>
              <TableCell>
                <Link href={`/fornitori/${f.id}`} className="font-medium hover:underline">{f.nome}</Link>
              </TableCell>
              <TableCell>{c.referente ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{c.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{c.telefono ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                {f.attivo ? <Badge variant="secondary">Attivo</Badge> : <Badge variant="outline">Disattivato</Badge>}
              </TableCell>
              <TableCell>
                <RoleGuard ruolo={currentRuolo} ruoli={["admin"]}>
                  <Button size="sm" variant="ghost" render={<Link href={`/fornitori/${f.id}/modifica`}>Modifica</Link>} />
                </RoleGuard>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
