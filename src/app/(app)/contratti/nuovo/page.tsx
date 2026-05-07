// src/app/(app)/contratti/nuovo/page.tsx
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContrattoForm } from "@/components/contratti/ContrattoForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await requireProfile();
  const { cliente } = await searchParams;

  const supabase = await createClient();
  const [clientiRes, fornitoriRes] = await Promise.all([
    supabase.from("clienti").select("id, nome").order("nome"),
    supabase.from("fornitori").select("id, nome").eq("attivo", true).order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo contratto</h1>
      <ContrattoForm clienti={clientiRes.data ?? []} fornitori={fornitoriRes.data ?? []} defaultClienteId={cliente} />
    </div>
  );
}
