import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getCliente } from "@/lib/clienti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo documento per {cliente.nome}</h1>
      <DocumentoForm clienti={[{ id: cliente.id, nome: cliente.nome }]} defaultClienteId={cliente.id} />
    </div>
  );
}
