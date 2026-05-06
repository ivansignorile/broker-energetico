"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/types";

export function ClientiFilters({ commerciali }: { commerciali: Pick<Profile, "id" | "nome_completo">[] }) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/clienti?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="q">Ricerca</Label>
        <Input
          id="q"
          placeholder="Nome, email, telefono..."
          defaultValue={search.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={search.get("tipo") ?? ""}
          onChange={(e) => update("tipo", e.target.value)}
        >
          <option value="">Tutti</option>
          <option value="privato">Privato</option>
          <option value="azienda">Azienda</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="commerciale">Commerciale</Label>
        <select
          id="commerciale"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={search.get("commerciale_id") ?? ""}
          onChange={(e) => update("commerciale_id", e.target.value)}
        >
          <option value="">Tutti</option>
          {commerciali.map((c) => (
            <option key={c.id} value={c.id}>{c.nome_completo}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
