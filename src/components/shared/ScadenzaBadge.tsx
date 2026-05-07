import { classificaScadenza, giorniAllaScadenza } from "@/lib/scadenze/helpers";

type Cls = ReturnType<typeof classificaScadenza>;

const STYLE: Record<Cls, { bg: string; fg: string; ring?: string }> = {
  scaduto:   { bg: "transparent",                fg: "var(--cohere-muted)", ring: "var(--cohere-hairline)" },
  critica:   { bg: "var(--cohere-coral)",        fg: "#fff" },
  imminente: { bg: "var(--cohere-coral-soft)",   fg: "var(--cohere-ink)" },
  vicina:    { bg: "var(--cohere-pale-blue)",    fg: "var(--cohere-action-blue)" },
  futura:    { bg: "var(--cohere-pale-green)",   fg: "var(--cohere-deep-green)" },
};

export function ScadenzaBadge({ data, withGiorni = true }: { data: string | null; withGiorni?: boolean }) {
  if (!data) return <span className="text-muted-foreground">—</span>;
  const giorni = giorniAllaScadenza(data);
  const cls = classificaScadenza(giorni);
  const s = STYLE[cls];
  const label = withGiorni
    ? giorni < 0 ? `Scaduto da ${-giorni}gg` : `${giorni}gg`
    : cls === "scaduto" ? "Scaduto" : cls === "critica" ? "Critica" : cls === "imminente" ? "30 gg" : cls === "vicina" ? "60 gg" : "OK";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        boxShadow: s.ring ? `inset 0 0 0 1px ${s.ring}` : undefined,
      }}
    >
      {label}
    </span>
  );
}
