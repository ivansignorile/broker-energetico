import type { StatoContratto } from "@/lib/supabase/types";

const STYLE: Record<StatoContratto, { bg: string; fg: string; ring?: string }> = {
  bozza:      { bg: "var(--cohere-soft-stone)",  fg: "var(--cohere-ink)",  ring: "var(--cohere-hairline)" },
  attivo:     { bg: "var(--cohere-deep-green)",  fg: "#fff" },
  scaduto:    { bg: "var(--cohere-coral-soft)",  fg: "var(--cohere-ink)" },
  rinnovato:  { bg: "var(--cohere-pale-blue)",   fg: "var(--cohere-action-blue)" },
  annullato:  { bg: "transparent",               fg: "var(--cohere-muted)", ring: "var(--cohere-hairline)" },
};

const LABEL: Record<StatoContratto, string> = {
  bozza: "Bozza",
  attivo: "Attivo",
  scaduto: "Scaduto",
  rinnovato: "Rinnovato",
  annullato: "Annullato",
};

export function ContrattoStatoBadge({ stato }: { stato: StatoContratto }) {
  const s = STYLE[stato];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        boxShadow: s.ring ? `inset 0 0 0 1px ${s.ring}` : undefined,
      }}
    >
      {LABEL[stato]}
    </span>
  );
}
