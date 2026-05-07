"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarBody } from "./SidebarBody";
import type { Profile } from "@/lib/supabase/types";

export function MobileNavDrawer({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const pathname = usePathname();

  // Chiudi il drawer al cambio di pathname (pattern setState during render)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Apri menu" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 max-w-[80vw] border-r-0 p-0">
        <SidebarBody profile={profile} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
