"use client";

import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { resetAllTutorials } from "@/components/tutorial/TutorialDialog";
import type { Profile } from "@/lib/supabase/types";

export function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function rivediTutorial() {
    resetAllTutorials();
    toast.success("Tutorial reimpostati. Ti verranno mostrati di nuovo nelle sezioni.");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{profile.nome_completo}</span>
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {profile.email} · <span className="capitalize">{profile.ruolo}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={rivediTutorial} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Rivedi i tutorial
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" /> Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
