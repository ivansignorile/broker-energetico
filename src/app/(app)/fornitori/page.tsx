import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { listFornitori } from "@/lib/fornitori/queries";
import { FornitoriTable } from "@/components/fornitori/FornitoriTable";

export default async function Page() {
  const profile = await requireProfile();
  const fornitori = await listFornitori();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fornitori</h1>
        {isAdmin(profile) && (
          <Button render={<Link href="/fornitori/nuovo"><Plus className="mr-2 h-4 w-4" /> Nuovo fornitore</Link>} />
        )}
      </div>
      <Card><CardContent className="p-0"><FornitoriTable rows={fornitori} currentRuolo={profile.ruolo} /></CardContent></Card>
    </div>
  );
}
