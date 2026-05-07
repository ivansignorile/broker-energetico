// src/components/contratti/ContrattoDeleteButton.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteContratto } from "@/lib/contratti/actions";
import { toast } from "sonner";

export function ContrattoDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteContratto(id);
      if (!res.ok) toast.error(res.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Elimina</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il contratto?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;operazione è irreversibile. Verrà cancellato anche l&apos;allegato PDF.
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
