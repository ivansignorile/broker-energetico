import { requireRole } from "@/lib/auth/session";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        area="Anagrafica · Fornitori"
        title="Nuovo fornitore"
        subtitle="Inserisci nome e contatti del fornitore. Lo userai poi nella creazione dei contratti."
      />
      <FornitoreForm />
    </div>
  );
}
