import { UserMenu } from "./UserMenu";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { TutorialLauncher } from "@/components/tutorial/TutorialLauncher";
import type { Profile } from "@/lib/supabase/types";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b cohere-hairline bg-background px-4 md:px-8">
      <div className="flex items-center gap-2">
        <MobileNavDrawer profile={profile} />
        <p className="cohere-mono-label">Gestionale broker</p>
      </div>
      <div className="flex items-center gap-1">
        <TutorialLauncher />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
