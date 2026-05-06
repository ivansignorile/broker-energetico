"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteFornitore } from "@/lib/fornitori/actions";
import { toast } from "sonner";

export function FornitoreDeleteButton({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteFornitore(id);
      if (!res.ok) toast.error(res.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;eliminazione fallisce se esistono contratti collegati. Per disattivarlo senza cancellarlo, modifica la voce &quot;Stato&quot; nel form.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? "Elimino..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
