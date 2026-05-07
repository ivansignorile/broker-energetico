import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clienti/ClienteForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: commerciali } = await supabase
    .from("profiles")
    .select("id, nome_completo")
    .eq("ruolo", "commerciale")
    .order("nome_completo");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        area="Anagrafica · Clienti"
        title="Nuovo cliente"
        subtitle="Compila i dati anagrafici. Se inserisci l'indirizzo, l'app cercherà automaticamente le coordinate per la mappa."
      />
      <ClienteForm
        commerciali={commerciali ?? []}
        currentRuolo={profile.ruolo}
        currentUserId={profile.id}
      />
    </div>
  );
}
