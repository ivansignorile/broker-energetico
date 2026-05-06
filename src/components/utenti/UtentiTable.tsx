import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Profile } from "@/lib/supabase/types";

const RUOLO_VARIANT: Record<Profile["ruolo"], "default" | "secondary" | "outline"> = {
  admin: "default",
  commerciale: "secondary",
  operatore: "outline",
};

export function UtentiTable({ profiles }: { profiles: Profile[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Nessun utente.
            </TableCell>
          </TableRow>
        )}
        {profiles.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.nome_completo}</TableCell>
            <TableCell className="text-muted-foreground">{p.email}</TableCell>
            <TableCell>
              <Badge variant={RUOLO_VARIANT[p.ruolo]} className="capitalize">{p.ruolo}</Badge>
            </TableCell>
            <TableCell>
              {p.attivo ? "Attivo" : <span className="text-muted-foreground">Disattivato</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
