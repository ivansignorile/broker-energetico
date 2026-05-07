import { cn } from "@/lib/utils";

type Props = {
  /** Mono-label sopra il titolo. Es: "Anagrafica" oppure "Operatività · Contratti". */
  area: string;
  /** Titolo principale. Tipografia cohere-display. */
  title: string;
  /** Sottotitolo opzionale. */
  subtitle?: React.ReactNode;
  /** Slot per badge/contatori (a destra del titolo). */
  meta?: React.ReactNode;
  /** Slot per i bottoni di azione, allineati a destra su md+. */
  actions?: React.ReactNode;
  /** Mostra il separatore hairline sotto. Default: true. */
  divider?: boolean;
  className?: string;
};

export function PageHeader({ area, title, subtitle, meta, actions, divider = true, className }: Props) {
  return (
    <header
      className={cn(
        "space-y-2",
        divider && "border-b cohere-hairline pb-5",
        className,
      )}
    >
      <p className="cohere-mono-label">{area}</p>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="cohere-display text-3xl md:text-4xl">{title}</h1>
            {meta}
          </div>
          {subtitle && (
            <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
