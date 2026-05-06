import type { Profile, Ruolo } from "@/lib/supabase/types";

export function RoleGuard({
  ruolo, ruoli, children,
}: {
  ruolo: Profile["ruolo"] | null | undefined;
  ruoli: Ruolo[];
  children: React.ReactNode;
}) {
  if (!ruolo || !ruoli.includes(ruolo)) return null;
  return <>{children}</>;
}
