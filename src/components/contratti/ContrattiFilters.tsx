// src/components/contratti/ContrattiFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { STATO } from "@/lib/validation/contratto-schema";
import type { Cliente, Fornitore } from "@/lib/supabase/types";

export function ContrattiFilters({ clienti, fornitori }: { clienti: Pick<Cliente, "id" | "nome">[]; fornitori: Pick<Fornitore, "id" | "nome">[] }) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/contratti?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="stato">Stato</Label>
        <select id="stato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("stato") ?? ""} onChange={(e) => update("stato", e.target.value)}>
          <option value="">Tutti</option>
          {STATO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cliente">Cliente</Label>
        <select id="cliente" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("cliente_id") ?? ""} onChange={(e) => update("cliente_id", e.target.value)}>
          <option value="">Tutti</option>
          {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="fornitore">Fornitore</Label>
        <select id="fornitore" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("fornitore_id") ?? ""} onChange={(e) => update("fornitore_id", e.target.value)}>
          <option value="">Tutti</option>
          {fornitori.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="entro">In scadenza entro</Label>
        <select id="entro" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={search.get("entro") ?? ""} onChange={(e) => update("entro", e.target.value)}>
          <option value="">Tutti</option>
          <option value="60">60 giorni</option>
          <option value="30">30 giorni</option>
          <option value="15">15 giorni</option>
          <option value="0">Oggi</option>
        </select>
      </div>
    </div>
  );
}
