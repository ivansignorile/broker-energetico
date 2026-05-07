"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, FileText, Folder, UserCog, Settings, Zap } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

const items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/clienti",    label: "Clienti",   icon: Users },
  { href: "/contratti",  label: "Contratti", icon: FileText },
  { href: "/documenti",  label: "Documenti", icon: Folder },
  { href: "/fornitori",  label: "Fornitori", icon: Building2 },
];

const adminItems: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: "/utenti",       label: "Utenti",       icon: UserCog },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden w-64 flex-col cohere-surface-near-black md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--cohere-deep-green)" }}>
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">Broker</p>
          <p className="cohere-mono-label" style={{ color: "rgba(255,255,255,0.55)" }}>energetico</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="cohere-mono-label px-3 pb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Operatività</p>
        <ul className="space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r"
                      style={{ backgroundColor: "var(--cohere-coral)" }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <RoleGuard ruolo={profile.ruolo} ruoli={["admin"]}>
          <div className="my-5 border-t border-white/10" />
          <p className="cohere-mono-label px-3 pb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Amministrazione</p>
          <ul className="space-y-0.5">
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r"
                        style={{ backgroundColor: "var(--cohere-coral)" }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </RoleGuard>
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="cohere-mono-label" style={{ color: "rgba(255,255,255,0.45)" }}>Loggato come</p>
        <p className="truncate text-sm font-medium text-white">{profile.nome_completo}</p>
        <p className="truncate text-xs capitalize" style={{ color: "rgba(255,255,255,0.55)" }}>{profile.ruolo}</p>
      </div>
    </aside>
  );
}
