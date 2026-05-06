import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listClienti, type ClientiFilter } from "@/lib/clienti/queries";
import { ClientiTable } from "@/components/clienti/ClientiTable";
import { ClientiFilters } from "@/components/clienti/ClientiFilters";
import { ExportClientiButton } from "@/components/clienti/ExportClientiButton";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireProfile();
  const sp = await searchParams;
  const filter: ClientiFilter = {
    q: sp.q,
    tipo: sp.tipo === "privato" || sp.tipo === "azienda" ? sp.tipo : undefined,
    commerciale_id: sp.commerciale_id || undefined,
  };
  const supabase = await createClient();
  const [clienti, profilesRes] = await Promise.all([
    listClienti(filter),
    supabase.from("profiles").select("id, nome_completo, ruolo").eq("ruolo", "commerciale"),
  ]);
  const commerciali = profilesRes.data ?? [];
  const commercialiMap = new Map(commerciali.map((p) => [p.id, p.nome_completo]));
  const rows = clienti.map((c) => ({ ...c, commerciale_nome: c.commerciale_id ? commercialiMap.get(c.commerciale_id) ?? null : null }));

  const exportParams: Record<string, string> = {};
  if (filter.q) exportParams.q = filter.q;
  if (filter.tipo) exportParams.tipo = filter.tipo;
  if (filter.commerciale_id) exportParams.commerciale_id = filter.commerciale_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clienti</h1>
        <div className="flex items-center gap-2">
          <ExportClientiButton params={exportParams} />
          <Button render={<Link href="/clienti/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo cliente</Link>} />
        </div>
      </div>
      <ClientiFilters commerciali={commerciali} />
      <ClientiTable rows={rows} />
    </div>
  );
}
