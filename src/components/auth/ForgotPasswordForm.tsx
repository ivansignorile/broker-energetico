"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().email("Email non valida") });
type Input = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Input) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
    if (error) toast.error("Errore invio email");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader><CardTitle>Email inviata</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Se l'indirizzo è registrato, riceverai un link per reimpostare la password.</p>
          <Link href="/login" className="text-sm underline">Torna al login</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Reimposta password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <Button type="submit" className="w-full">Invia link di reset</Button>
        </form>
      </CardContent>
    </Card>
  );
}
