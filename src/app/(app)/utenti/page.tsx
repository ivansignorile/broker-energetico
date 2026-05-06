import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UtentiTable } from "@/components/utenti/UtentiTable";

export default async function Page() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utenti</h1>
        <Button render={<Link href="/utenti/invita"><UserPlus className="mr-2 h-4 w-4" /> Invita utente</Link>} />
      </div>
      <Card><CardContent className="p-0"><UtentiTable profiles={data ?? []} /></CardContent></Card>
    </div>
  );
}
