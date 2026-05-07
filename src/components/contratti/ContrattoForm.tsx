"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  contrattoSchema, CATEGORIA, TIPI_PER_CATEGORIA, STATO, MERCATO,
  type ContrattoInput,
} from "@/lib/validation/contratto-schema";
import { createContratto, updateContratto } from "@/lib/contratti/actions";
import type { Contratto, Cliente, Fornitore } from "@/lib/supabase/types";

type Props = {
  contratto?: Contratto;
  clienti: Pick<Cliente, "id" | "nome">[];
  fornitori: Pick<Fornitore, "id" | "nome">[];
  defaultClienteId?: string;
};

export function ContrattoForm({ contratto, clienti, fornitori, defaultClienteId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContrattoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contrattoSchema) as any,
    defaultValues: {
      cliente_id: contratto?.cliente_id ?? defaultClienteId ?? "",
      fornitore_id: contratto?.fornitore_id ?? "",
      categoria: contratto?.categoria ?? "energia",
      tipo: contratto?.tipo ?? "luce",
      mercato: contratto?.mercato ?? null,
      pod: contratto?.pod ?? "",
      pdr: contratto?.pdr ?? "",
      data_inizio: contratto?.data_inizio ?? "",
      data_scadenza: contratto?.data_scadenza ?? "",
      stato: contratto?.stato ?? "bozza",
      note: contratto?.note ?? "",
    },
  });

  const categoria = form.watch("categoria");
  const tipo = form.watch("tipo");
  const tipiAmmessi = TIPI_PER_CATEGORIA[categoria];
  const showPod = tipo === "luce" || tipo === "dual_fuel";
  const showPdr = tipo === "gas" || tipo === "dual_fuel";

  async function onSubmit(values: ContrattoInput) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
      const fileInput = (document.getElementById("allegato") as HTMLInputElement | null);
      if (fileInput?.files?.[0]) fd.append("allegato", fileInput.files[0]);

      const res = contratto ? await updateContratto(contratto.id, fd) : await createContratto(fd);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof ContrattoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(contratto ? "Contratto aggiornato" : "Contratto creato");
      const id = contratto ? contratto.id : (res as { ok: true; data?: { id: string } }).data?.id;
      router.push(id ? `/contratti/${id}` : "/contratti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <select id="cliente_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("cliente_id")}>
                <option value="">— seleziona —</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {form.formState.errors.cliente_id && (
                <p className="text-sm text-destructive">{form.formState.errors.cliente_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornitore_id">Fornitore *</Label>
              <select id="fornitore_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("fornitore_id")}>
                <option value="">— seleziona —</option>
                {fornitori.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {form.formState.errors.fornitore_id && (
                <p className="text-sm text-destructive">{form.formState.errors.fornitore_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select id="categoria" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("categoria")}>
                {CATEGORIA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select id="tipo" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("tipo")}>
                {tipiAmmessi.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.formState.errors.tipo && (
                <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mercato">Mercato</Label>
              <select id="mercato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("mercato")}>
                <option value="">— non specificato —</option>
                {MERCATO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stato">Stato</Label>
              <select id="stato" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("stato")}>
                {STATO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {showPod && (
              <div className="space-y-2">
                <Label htmlFor="pod">POD</Label>
                <Input id="pod" {...form.register("pod")} placeholder="IT001E12345678" />
              </div>
            )}
            {showPdr && (
              <div className="space-y-2">
                <Label htmlFor="pdr">PDR</Label>
                <Input id="pdr" {...form.register("pdr")} placeholder="0123456789012345" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="data_inizio">Data inizio *</Label>
              <Input id="data_inizio" type="date" {...form.register("data_inizio")} />
              {form.formState.errors.data_inizio && (
                <p className="text-sm text-destructive">{form.formState.errors.data_inizio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_scadenza">Data scadenza *</Label>
              <Input id="data_scadenza" type="date" {...form.register("data_scadenza")} />
              {form.formState.errors.data_scadenza && (
                <p className="text-sm text-destructive">{form.formState.errors.data_scadenza.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={3} {...form.register("note")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allegato">Allegato PDF (opzionale)</Label>
            <input id="allegato" name="allegato" type="file" accept="application/pdf" className="block text-sm" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : contratto ? "Salva modifiche" : "Crea contratto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
