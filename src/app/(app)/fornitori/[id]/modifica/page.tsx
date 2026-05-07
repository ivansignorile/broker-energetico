import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        area="Anagrafica · Fornitori"
        title={`Modifica ${f.nome}`}
        subtitle="Aggiorna nome, contatti o disattiva il fornitore senza cancellarne lo storico."
      />
      <FornitoreForm fornitore={f} />
    </div>
  );
}
