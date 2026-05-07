"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTutorialForPath } from "@/lib/tutorial/contents";
import { TutorialDialog, isTutorialSeen } from "./TutorialDialog";

export function TutorialLauncher() {
  const pathname = usePathname();
  const content = getTutorialForPath(pathname);
  const [open, setOpen] = useState(false);

  // Auto-open al primo accesso a una sezione
  useEffect(() => {
    if (!content) return;
    if (!isTutorialSeen(content.key)) {
      // piccolo delay così la pagina si compone prima
      const t = setTimeout(() => setOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [content?.key, content]);

  if (!content) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Mostra tutorial della sezione"
        className="gap-1.5"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Tutorial</span>
      </Button>
      <TutorialDialog content={content} open={open} onOpenChange={setOpen} />
    </>
  );
}
