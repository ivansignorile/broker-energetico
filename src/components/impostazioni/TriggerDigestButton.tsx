"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerDigest } from "@/app/(app)/impostazioni/trigger-digest-action";

export function TriggerDigestButton() {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      const r = await triggerDigest();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Digest inviato: ${r.summary.email_inviate} email a ${r.summary.utenti_notificati} utenti`);
    });
  }
  return (
    <Button onClick={onClick} disabled={pending}>
      <Send className="mr-2 h-4 w-4" /> {pending ? "Invio..." : "Invia digest ora"}
    </Button>
  );
}
