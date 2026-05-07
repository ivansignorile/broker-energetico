import { Badge } from "@/components/ui/badge";
import type { StatoContratto } from "@/lib/supabase/types";

const VARIANT: Record<StatoContratto, "default" | "secondary" | "outline" | "destructive"> = {
  bozza: "outline",
  attivo: "default",
  scaduto: "destructive",
  rinnovato: "secondary",
  annullato: "outline",
};

const LABEL: Record<StatoContratto, string> = {
  bozza: "Bozza",
  attivo: "Attivo",
  scaduto: "Scaduto",
  rinnovato: "Rinnovato",
  annullato: "Annullato",
};

export function ContrattoStatoBadge({ stato }: { stato: StatoContratto }) {
  return <Badge variant={VARIANT[stato]} className="capitalize">{LABEL[stato]}</Badge>;
}
