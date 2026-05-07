import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getCliente } from "@/lib/clienti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        area={`Documento · ${cliente.nome}`}
        title="Carica un nuovo documento"
        subtitle="Solo PDF, fino a 10 MB. Per i documenti d'identità la data di scadenza è obbligatoria."
      />
      <DocumentoForm clienti={[{ id: cliente.id, nome: cliente.nome }]} defaultClienteId={cliente.id} />
    </div>
  );
}
