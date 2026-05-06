import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCliente } from "@/lib/clienti/queries";
import { ClienteForm } from "@/components/clienti/ClienteForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const supabase = await createClient();
  const { data: commerciali } = await supabase
    .from("profiles")
    .select("id, nome_completo")
    .eq("ruolo", "commerciale")
    .order("nome_completo");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica {cliente.nome}</h1>
      <ClienteForm
        cliente={cliente}
        commerciali={commerciali ?? []}
        currentRuolo={profile.ruolo}
        currentUserId={profile.id}
      />
    </div>
  );
}
