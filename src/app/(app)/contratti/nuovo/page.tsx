import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContrattoForm } from "@/components/contratti/ContrattoForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await requireProfile();
  const { cliente } = await searchParams;

  const supabase = await createClient();
  const [clientiRes, fornitoriRes] = await Promise.all([
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").eq("attivo", true).order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        area="Operatività · Contratti"
        title="Nuovo contratto"
        subtitle="Cliente, fornitore, tipo di fornitura, date e (opzionale) PDF firmato. POD e PDR appaiono in base al tipo scelto."
      />
      <ContrattoForm clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} defaultClienteId={cliente} />
    </div>
  );
}
