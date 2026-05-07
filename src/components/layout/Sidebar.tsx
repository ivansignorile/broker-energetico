import { SidebarBody } from "./SidebarBody";
import type { Profile } from "@/lib/supabase/types";

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <SidebarBody profile={profile} />
    </aside>
  );
}
