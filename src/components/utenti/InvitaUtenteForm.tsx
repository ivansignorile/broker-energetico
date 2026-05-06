"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { invitoSchema, type InvitoInput } from "@/lib/validation/invito-schema";
import { invitaUtente } from "@/lib/auth/invite-action";

export function InvitaUtenteForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<InvitoInput>({
    resolver: zodResolver(invitoSchema),
    defaultValues: { email: "", nome_completo: "", ruolo: "operatore" },
  });

  async function onSubmit(values: InvitoInput) {
    setSubmitting(true);
    try {
      const res = await invitaUtente(values);
      if (!res.ok) {
        if (res.fields) {
          for (const [k, msg] of Object.entries(res.fields)) {
            form.setError(k as keyof InvitoInput, { type: "server", message: msg });
          }
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success("Invito inviato");
      router.push("/utenti");
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
            <Label htmlFor="nome_completo">Nome completo</Label>
            <Input id="nome_completo" {...form.register("nome_completo")} />
            {form.formState.errors.nome_completo && (
              <p className="text-sm text-destructive">{form.formState.errors.nome_completo.message}</p>
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
            <Label htmlFor="ruolo">Ruolo</Label>
            <select
              id="ruolo"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("ruolo")}
            >
              <option value="admin">Admin</option>
              <option value="commerciale">Commerciale</option>
              <option value="operatore">Operatore</option>
            </select>
            {form.formState.errors.ruolo && (
              <p className="text-sm text-destructive">{form.formState.errors.ruolo.message}</p>
            )}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Invio in corso..." : "Invia invito"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
