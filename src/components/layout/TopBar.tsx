import { UserMenu } from "./UserMenu";
import { TutorialLauncher } from "@/components/tutorial/TutorialLauncher";
import type { Profile } from "@/lib/supabase/types";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-16 items-center justify-between border-b cohere-hairline bg-background px-4 md:px-8">
      <p className="cohere-mono-label">Gestionale broker</p>
      <div className="flex items-center gap-1">
        <TutorialLauncher />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
