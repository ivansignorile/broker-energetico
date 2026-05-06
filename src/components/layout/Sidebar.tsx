import Link from "next/link";
import { LayoutDashboard, Users, Building2, FileText, Folder, UserCog, Settings } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { Profile } from "@/lib/supabase/types";

const items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/clienti",    label: "Clienti",   icon: Users },
  { href: "/contratti",  label: "Contratti", icon: FileText },
  { href: "/documenti",  label: "Documenti", icon: Folder },
  { href: "/fornitori",  label: "Fornitori", icon: Building2 },
];

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-60 flex-col border-r bg-muted/40 md:flex">
      <div className="flex h-14 items-center border-b px-6 font-semibold">
        Broker Energetico
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
        <RoleGuard ruolo={profile.ruolo} ruoli={["admin"]}>
          <div className="my-2 border-t" />
          <Link href="/utenti" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <UserCog className="h-4 w-4" /> Utenti
          </Link>
          <Link href="/impostazioni" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Settings className="h-4 w-4" /> Impostazioni
          </Link>
        </RoleGuard>
      </nav>
    </aside>
  );
}
