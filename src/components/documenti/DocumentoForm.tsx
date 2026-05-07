// src/components/documenti/DocumentoForm.tsx
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
  documentoSchema, TIPO_DOCUMENTO, TIPI_SCADENZA_RICHIESTA,
  type DocumentoInput,
} from "@/lib/validation/documento-schema";
import { createDocumento, updateDocumento } from "@/lib/documenti/actions";
import type { Documento, Cliente } from "@/lib/supabase/types";

type Props = {
  documento?: Documento;
  clienti: Pick<Cliente, "id" | "nome">[];
  defaultClienteId?: string;
};

export function DocumentoForm({ documento, clienti, defaultClienteId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DocumentoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(documentoSchema) as any,
    defaultValues: {
      cliente_id: documento?.cliente_id ?? defaultClienteId ?? "",
      tipo: documento?.tipo ?? "carta_identita",
      descrizione: documento?.descrizione ?? "",
      data_scadenza: documento?.data_scadenza ?? "",
      note: documento?.note ?? "",
    },
  });

  const tipo = form.watch("tipo");
  const richiesta = TIPI_SCADENZA_RICHIESTA.includes(tipo);
  const isAltro = tipo === "altro";

  async function onSubmit(values: DocumentoInput) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
      const fileInput = document.getElementById("file") as HTMLInputElement | null;
      if (fileInput?.files?.[0]) fd.append("file", fileInput.files[0]);

      const res = documento ? await updateDocumento(documento.id, fd) : await createDocumento(fd);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof DocumentoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(documento ? "Documento aggiornato" : "Documento caricato");
      router.push(documento ? `/clienti/${values.cliente_id}` : "/documenti");
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <select id="tipo" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...form.register("tipo")}>
                {TIPO_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {isAltro && (
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione *</Label>
              <Input id="descrizione" {...form.register("descrizione")} placeholder="Es. Contratto fornitura legna" />
              {form.formState.errors.descrizione && (
                <p className="text-sm text-destructive">{form.formState.errors.descrizione.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="data_scadenza">Data scadenza {richiesta ? "*" : "(opzionale)"}</Label>
            <Input id="data_scadenza" type="date" {...form.register("data_scadenza")} />
            {form.formState.errors.data_scadenza && (
              <p className="text-sm text-destructive">{form.formState.errors.data_scadenza.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={3} {...form.register("note")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File PDF {documento ? "(lascia vuoto per non sostituire)" : "*"}</Label>
            <input id="file" name="file" type="file" accept="application/pdf" className="block text-sm" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : documento ? "Salva modifiche" : "Carica documento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
