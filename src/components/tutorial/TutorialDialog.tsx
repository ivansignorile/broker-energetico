"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TutorialContent } from "@/lib/tutorial/contents";

const SEEN_PREFIX = "tutorial-seen:";

export function TutorialDialog({
  content,
  open,
  onOpenChange,
}: {
  content: TutorialContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [activeKey, setActiveKey] = useState(content.key);

  // Resync state during render (React-supported pattern) when section changes
  if (activeKey !== content.key) {
    setActiveKey(content.key);
    setStepIdx(0);
  }

  const isLast = stepIdx === content.steps.length - 1;
  const isFirst = stepIdx === 0;
  const step = content.steps[stepIdx];

  function close() {
    try {
      window.localStorage.setItem(`${SEEN_PREFIX}${content.key}`, "1");
    } catch {
      // localStorage potrebbe non essere disponibile (private mode); ignora
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="cohere-mono-label">{content.area} · {stepIdx + 1} di {content.steps.length}</p>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground">
            {step.body}
          </DialogDescription>
        </DialogHeader>

        {step.hint && (
          <div
            className="flex gap-3 rounded-lg p-3 text-sm"
            style={{ backgroundColor: "var(--cohere-pale-blue)", color: "var(--cohere-action-blue)" }}
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{step.hint}</p>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {content.steps.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === stepIdx ? 24 : 8,
                backgroundColor: i === stepIdx ? "var(--cohere-deep-green)" : "var(--cohere-hairline)",
              }}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:flex-row sm:justify-between">
          <DialogClose
            render={
              <Button variant="ghost" size="sm" onClick={close}>
                Salta tutorial
              </Button>
            }
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={isFirst}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Indietro
            </Button>
            {isLast ? (
              <Button size="sm" onClick={close}>
                Inizia
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStepIdx((i) => Math.min(content.steps.length - 1, i + 1))}
              >
                Avanti <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Helper: marca un tutorial come "visto" senza aprirlo. */
export function markTutorialSeen(key: string): void {
  try {
    window.localStorage.setItem(`${SEEN_PREFIX}${key}`, "1");
  } catch {
    /* noop */
  }
}

/** Helper: dimentica tutti i tutorial visti (usato dal pulsante "rivedi tutorial"). */
export function resetAllTutorials(): void {
  try {
    const ls = window.localStorage;
    const keys = Object.keys(ls).filter((k) => k.startsWith(SEEN_PREFIX));
    keys.forEach((k) => ls.removeItem(k));
  } catch {
    /* noop */
  }
}

/** Helper: verifica se un tutorial è stato visto. */
export function isTutorialSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(`${SEEN_PREFIX}${key}`) === "1";
  } catch {
    return false;
  }
}
