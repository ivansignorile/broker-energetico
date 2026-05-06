import { requireRole } from "@/lib/auth/session";
import { InvitaUtenteForm } from "@/components/utenti/InvitaUtenteForm";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Invita un utente</h1>
      <InvitaUtenteForm />
    </div>
  );
}
