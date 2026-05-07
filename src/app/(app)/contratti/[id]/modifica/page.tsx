import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getContratto } from "@/lib/contratti/queries";
import { ContrattoForm } from "@/components/contratti/ContrattoForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const c = await getContratto(id);
  if (!c) notFound();

  const supabase = await createClient();
  const [clientiRes, fornitoriRes] = await Promise.all([
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        area="Operatività · Contratti"
        title="Modifica contratto"
        subtitle="Cambia dati, stato o sostituisci l'allegato. Per rinnovare un contratto attivo usa il bottone Rinnova nella scheda di dettaglio."
      />
      <ContrattoForm contratto={c} clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} />
    </div>
  );
}
