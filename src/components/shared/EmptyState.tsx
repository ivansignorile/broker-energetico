import { cn } from "@/lib/utils";

type Props = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  surface?: "stone" | "canvas";
  className?: string;
};

export function EmptyState({
  icon: Icon, title, description, action, surface = "stone", className,
}: Props) {
  const surfaceClass = surface === "stone"
    ? "cohere-surface-stone"
    : "bg-card border cohere-hairline";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16 text-center",
        surfaceClass,
        className,
      )}
    >
      {Icon && (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,60,51,0.1)", color: "var(--cohere-deep-green)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
