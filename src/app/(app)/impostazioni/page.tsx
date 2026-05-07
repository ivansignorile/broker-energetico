import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { listRecentCronRuns } from "@/lib/cron/runs";
import { TriggerDigestButton } from "@/components/impostazioni/TriggerDigestButton";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page() {
  await requireRole("admin");
  const runs = await listRecentCronRuns(20);

  return (
    <div className="space-y-8">
      <PageHeader
        area="Amministrazione"
        title="Impostazioni"
        subtitle="Operazioni di sistema e visibilità sui job automatici."
      />

      <Card>
        <CardHeader><CardTitle>Digest scadenze</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Il digest viene inviato automaticamente ogni giorno alle 06:00 UTC (08:00 ora italiana in estate). Forzalo ora se hai bisogno di recuperare un giorno saltato.
          </p>
          <TriggerDigestButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Storico run automatici</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Esito</TableHead>
                <TableHead>Riepilogo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nessun run ancora registrato.</TableCell></TableRow>
              )}
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize">{r.job_name.replace(/-/g, " ")}</TableCell>
                  <TableCell className="text-sm">{new Date(r.run_at).toLocaleString("it-IT")}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={r.ok
                        ? { backgroundColor: "var(--cohere-pale-green)", color: "var(--cohere-deep-green)" }
                        : { backgroundColor: "var(--cohere-coral-soft)", color: "var(--cohere-ink)" }}
                    >
                      {r.ok ? "OK" : "Errore"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground"><code>{JSON.stringify(r.summary)}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
