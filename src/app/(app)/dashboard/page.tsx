import { Suspense } from "react";
import { requireProfile } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";
import { ScadenzeWidget } from "@/components/dashboard/ScadenzeWidget";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";

export default async function DashboardPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-3">
        <p className="cohere-mono-label">Dashboard · {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="cohere-display text-4xl md:text-5xl">
          Buongiorno, <span style={{ color: "var(--cohere-deep-green)" }}>{profile.nome_completo.split(" ")[0]}</span>.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Ecco un quadro veloce delle scadenze in arrivo e dei numeri principali del tuo portafoglio.
        </p>
      </section>

      <Suspense fallback={<DashboardKpisSkeleton />}>
        <DashboardKpis />
      </Suspense>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b cohere-hairline pb-3">
          <div>
            <p className="cohere-mono-label">In arrivo</p>
            <h2 className="text-2xl font-medium tracking-tight">Scadenze imminenti</h2>
          </div>
          <p className="hidden text-xs text-muted-foreground md:block">Finestra di 60 giorni</p>
        </div>
        <Suspense fallback={<div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
          <ScadenzeWidget />
        </Suspense>
      </section>
    </div>
  );
}

function DashboardKpisSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
    </div>
  );
}
