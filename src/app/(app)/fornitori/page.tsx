import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { listFornitori } from "@/lib/fornitori/queries";
import { FornitoriTable } from "@/components/fornitori/FornitoriTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function Page() {
  const profile = await requireProfile();
  const fornitori = await listFornitori();
  const attivi = fornitori.filter((f) => f.attivo).length;
  return (
    <div className="space-y-8">
      <PageHeader
        area="Anagrafica"
        title="Fornitori"
        subtitle={`${fornitori.length} fornitori in rubrica · ${attivi} attivi.`}
        actions={
          isAdmin(profile) ? (
            <Button render={<Link href="/fornitori/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo fornitore</Link>} />
          ) : null
        }
      />
      {fornitori.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Ancora nessun fornitore"
          description={isAdmin(profile)
            ? "Aggiungi il primo fornitore per poter creare contratti."
            : "Nessun fornitore configurato. Chiedi a un admin di aggiungerli."}
          action={isAdmin(profile) ? (
            <Button render={<Link href="/fornitori/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo fornitore</Link>} />
          ) : undefined}
        />
      ) : (
        <Card><CardContent className="p-0"><FornitoriTable rows={fornitori} currentRuolo={profile.ruolo} /></CardContent></Card>
      )}
    </div>
  );
}
