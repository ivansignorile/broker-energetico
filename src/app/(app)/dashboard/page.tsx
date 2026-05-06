import { requireProfile } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader><CardTitle>Benvenuto, {profile.nome_completo}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Il widget delle scadenze sarà disponibile dopo l'implementazione di contratti e documenti.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
