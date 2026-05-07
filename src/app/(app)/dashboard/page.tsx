// src/app/(app)/dashboard/page.tsx
import { Suspense } from "react";
import { requireProfile } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";
import { ScadenzeWidget } from "@/components/dashboard/ScadenzeWidget";

export default async function DashboardPage() {
  const profile = await requireProfile();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Benvenuto, {profile.nome_completo}</p>
      </div>
      <Suspense fallback={<div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
        <ScadenzeWidget />
      </Suspense>
    </div>
  );
}
