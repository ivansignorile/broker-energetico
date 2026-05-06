"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCliente } from "@/lib/clienti/actions";
import { toast } from "sonner";

export function ClienteDeleteButton({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  function onConfirm() {
    start(async () => {
      const res = await deleteCliente(id);
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
            L&apos;operazione è irreversibile. Verranno cancellati anche i contratti e i documenti collegati.
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
