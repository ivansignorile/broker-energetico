import { UserMenu } from "./UserMenu";
import type { Profile } from "@/lib/supabase/types";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div /> {/* hamburger / search globale: fase successiva */}
      <UserMenu profile={profile} />
    </header>
  );
}
