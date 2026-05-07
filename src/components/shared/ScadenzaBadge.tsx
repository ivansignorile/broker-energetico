import { Badge } from "@/components/ui/badge";
import { classificaScadenza, giorniAllaScadenza } from "@/lib/scadenze/helpers";

const VARIANT: Record<ReturnType<typeof classificaScadenza>, "default" | "secondary" | "outline" | "destructive"> = {
  scaduto: "outline",
  critica: "destructive",
  imminente: "default",
  vicina: "secondary",
  futura: "secondary",
};

const LABEL: Record<ReturnType<typeof classificaScadenza>, string> = {
  scaduto: "Scaduto",
  critica: "Critica",
  imminente: "30 gg",
  vicina: "60 gg",
  futura: "OK",
};

export function ScadenzaBadge({ data, withGiorni = true }: { data: string | null; withGiorni?: boolean }) {
  if (!data) return <span className="text-muted-foreground">—</span>;
  const giorni = giorniAllaScadenza(data);
  const cls = classificaScadenza(giorni);
  const label = withGiorni
    ? giorni < 0 ? `Scaduto da ${-giorni}gg` : `${giorni}gg`
    : LABEL[cls];
  return <Badge variant={VARIANT[cls]}>{label}</Badge>;
}
