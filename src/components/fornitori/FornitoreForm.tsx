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
import { fornitoreSchema, type FornitoreInput } from "@/lib/validation/fornitore-schema";
import { createFornitore, updateFornitore } from "@/lib/fornitori/actions";
import type { Fornitore } from "@/lib/supabase/types";

export function FornitoreForm({ fornitore }: { fornitore?: Fornitore }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FornitoreInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fornitoreSchema) as any,
    defaultValues: {
      nome: fornitore?.nome ?? "",
      contatti: (fornitore?.contatti as { referente?: string; email?: string; telefono?: string } | null) ?? {
        referente: "", email: "", telefono: "",
      },
      note: fornitore?.note ?? "",
      attivo: fornitore?.attivo ?? true,
    },
  });

  async function onSubmit(values: FornitoreInput) {
    setSubmitting(true);
    try {
      const res = fornitore ? await updateFornitore(fornitore.id, values) : await createFornitore(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(fornitore ? "Fornitore aggiornato" : "Fornitore creato");
      router.push("/fornitori");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...form.register("nome")} />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="referente">Referente</Label>
              <Input id="referente" {...form.register("contatti.referente")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" {...form.register("contatti.email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctelefono">Telefono</Label>
              <Input id="ctelefono" {...form.register("contatti.telefono")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={4} {...form.register("note")} />
          </div>
          <div className="flex items-center gap-2">
            <input id="attivo" type="checkbox" {...form.register("attivo")} className="h-4 w-4" />
            <Label htmlFor="attivo">Fornitore attivo</Label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : fornitore ? "Salva modifiche" : "Crea fornitore"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
