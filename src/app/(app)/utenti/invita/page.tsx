import { requireRole } from "@/lib/auth/session";
import { InvitaUtenteForm } from "@/components/utenti/InvitaUtenteForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader
        area="Amministrazione · Utenti"
        title="Invita un utente"
        subtitle="Riceverà un'email per impostare la password e accederà subito con il ruolo che gli assegni."
      />
      <InvitaUtenteForm />
    </div>
  );
}
