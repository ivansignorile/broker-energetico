// src/components/contratti/RinnovaContrattoButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { rinnovaContratto } from "@/lib/contratti/actions";
import { toast } from "sonner";

export function RinnovaContrattoButton({ id, defaultStart, defaultEnd }: { id: string; defaultStart: string; defaultEnd: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [pending, startTr] = useTransition();

  function onConfirm() {
    startTr(async () => {
      const res = await rinnovaContratto(id, { data_inizio: start, data_scadenza: end });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Contratto rinnovato");
      setOpen(false);
      const newId = (res as { ok: true; data?: { newId: string } }).data?.newId;
      if (newId) router.push(`/contratti/${newId}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" /> Rinnova</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rinnova contratto</DialogTitle>
          <DialogDescription>
            Crea un nuovo contratto attivo con stesso cliente/fornitore/tipo. Il contratto corrente verrà marcato come &quot;rinnovato&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="start">Nuova data inizio</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end">Nuova data scadenza</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Rinnovo..." : "Rinnova"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
