import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clienti/ClienteForm";

export default async function Page() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: commerciali } = await supabase
    .from("profiles")
    .select("id, nome_completo")
    .eq("ruolo", "commerciale")
    .order("nome_completo");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo cliente</h1>
      <ClienteForm
        commerciali={commerciali ?? []}
        currentRuolo={profile.ruolo}
        currentUserId={profile.id}
      />
    </div>
  );
}
