// src/components/documenti/DocumentiFilterBar.tsx
"use client";

import { Label } from "@/components/ui/label";

export function DocumentiFilterBar() {
  return (
    <form className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="entro">In scadenza entro</Label>
        <select id="entro" name="entro" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" onChange={(e) => { window.location.href = `/documenti?entro=${e.currentTarget.value}`; }}>
          <option value="">Tutti</option>
          <option value="60">60 giorni</option>
          <option value="30">30 giorni</option>
          <option value="15">15 giorni</option>
          <option value="0">Oggi</option>
        </select>
      </div>
    </form>
  );
}
