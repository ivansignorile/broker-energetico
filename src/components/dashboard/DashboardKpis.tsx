import Link from "next/link";
import { Users, FileText, Folder, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Kpi = {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  surface: "canvas" | "stone" | "deep" | "pale-blue";
  caption?: string;
};

export async function DashboardKpis() {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in60Date = new Date(now);
  in60Date.setDate(in60Date.getDate() + 60);
  const in60 = in60Date.toISOString().slice(0, 10);

  const [clientiRes, contrattiRes, contrattiScadRes, documentiScadRes] = await Promise.all([
    supabase.from("clienti").select("id", { count: "exact", head: true }),
    supabase.from("contratti").select("id", { count: "exact", head: true }).eq("stato", "attivo"),
    supabase.from("contratti").select("id", { count: "exact", head: true })
      .eq("stato", "attivo").gte("data_scadenza", today).lte("data_scadenza", in60),
    supabase.from("documenti").select("id", { count: "exact", head: true })
      .not("data_scadenza", "is", null).gte("data_scadenza", today).lte("data_scadenza", in60),
  ]);

  const kpis: Kpi[] = [
    { label: "Clienti", value: clientiRes.count ?? 0, href: "/clienti", icon: Users, surface: "canvas" },
    { label: "Contratti attivi", value: contrattiRes.count ?? 0, href: "/contratti?stato=attivo", icon: FileText, surface: "stone" },
    { label: "Contratti in scadenza", value: contrattiScadRes.count ?? 0, href: "/contratti?entro=60", icon: AlertTriangle, surface: "deep", caption: "60 giorni" },
    { label: "Documenti in scadenza", value: documentiScadRes.count ?? 0, href: "/documenti?entro=60", icon: Folder, surface: "pale-blue", caption: "60 giorni" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
    </div>
  );
}

function KpiCard({ label, value, href, icon: Icon, surface, caption }: Kpi) {
  const surfaceClass =
    surface === "stone"      ? "cohere-surface-stone text-foreground" :
    surface === "deep"       ? "cohere-surface-deep" :
    surface === "pale-blue"  ? "cohere-surface-pale-blue text-foreground" :
                                "bg-card text-card-foreground border cohere-hairline";

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${surfaceClass}`}
    >
      <div className="flex items-start justify-between">
        <p className="cohere-mono-label" style={surface === "deep" ? { color: "rgba(255,255,255,0.6)" } : undefined}>
          {label}
        </p>
        <Icon className="h-4 w-4 opacity-60" />
      </div>
      <div className="mt-6 flex items-baseline justify-between gap-3">
        <span className="cohere-display text-4xl">{value.toLocaleString("it-IT")}</span>
        {caption && (
          <span
            className="text-xs"
            style={surface === "deep" ? { color: "rgba(255,255,255,0.55)" } : { color: "var(--cohere-muted)" }}
          >
            {caption}
          </span>
        )}
      </div>
    </Link>
  );
}
