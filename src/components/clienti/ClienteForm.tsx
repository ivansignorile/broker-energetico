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
import { clienteSchema, type ClienteInput } from "@/lib/validation/cliente-schema";
import { createCliente, updateCliente } from "@/lib/clienti/actions";
import type { Cliente, Profile } from "@/lib/supabase/types";

type Props = {
  cliente?: Cliente;
  commerciali: Pick<Profile, "id" | "nome_completo">[];
  currentRuolo: Profile["ruolo"];
  currentUserId: string;
};

export function ClienteForm({ cliente, commerciali, currentRuolo, currentUserId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ClienteInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      tipo_cliente: cliente?.tipo_cliente ?? "privato",
      nome: cliente?.nome ?? "",
      email: cliente?.email ?? "",
      telefono: cliente?.telefono ?? "",
      indirizzo: cliente?.indirizzo ?? "",
      lat: cliente?.lat ?? null,
      lng: cliente?.lng ?? null,
      note: cliente?.note ?? "",
      commerciale_id: cliente?.commerciale_id ?? (currentRuolo === "commerciale" ? currentUserId : null),
    },
  });

  async function onSubmit(values: ClienteInput) {
    setSubmitting(true);
    try {
      const res = cliente ? await updateCliente(cliente.id, values) : await createCliente(values);
      if (!res.ok) {
        if ("fields" in res && res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof ClienteInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(cliente ? "Cliente aggiornato" : "Cliente creato");
      const id = cliente ? cliente.id : (res as { ok: true; data?: { id: string } }).data?.id;
      router.push(id ? `/clienti/${id}` : "/clienti");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const isCommerciale = currentRuolo === "commerciale";

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo_cliente">Tipo</Label>
              <select
                id="tipo_cliente"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...form.register("tipo_cliente")}
              >
                <option value="privato">Privato</option>
                <option value="azienda">Azienda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome / Ragione sociale *</Label>
              <Input id="nome" {...form.register("nome")} />
              {form.formState.errors.nome && (
                <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" {...form.register("telefono")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input id="indirizzo" {...form.register("indirizzo")} placeholder="Via, civico, città, CAP" />
            <p className="text-xs text-muted-foreground">
              Verrà geolocalizzato al salvataggio. Se preferisci coordinate manuali, compila lat/lng sotto.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitudine</Label>
              <Input id="lat" type="number" step="any" {...form.register("lat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitudine</Label>
              <Input id="lng" type="number" step="any" {...form.register("lng")} />
              {form.formState.errors.lat && (
                <p className="text-sm text-destructive">{form.formState.errors.lat.message}</p>
              )}
            </div>
          </div>
          {!isCommerciale && (
            <div className="space-y-2">
              <Label htmlFor="commerciale_id">Commerciale assegnato</Label>
              <select
                id="commerciale_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...form.register("commerciale_id")}
              >
                <option value="">— nessuno —</option>
                {commerciali.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome_completo}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={4} {...form.register("note")} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : cliente ? "Salva modifiche" : "Crea cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
