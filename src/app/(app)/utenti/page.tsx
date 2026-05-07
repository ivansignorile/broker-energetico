import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UtentiTable } from "@/components/utenti/UtentiTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const utenti = data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        area="Amministrazione"
        title="Utenti"
        subtitle={`${utenti.length} ${utenti.length === 1 ? "utente registrato" : "utenti registrati"}.`}
        actions={
          <Button render={<Link href="/utenti/invita"><UserPlus className="mr-2 h-4 w-4" /> Invita utente</Link>} />
        }
      />
      <Card><CardContent className="p-0"><UtentiTable profiles={utenti} /></CardContent></Card>
    </div>
  );
}
