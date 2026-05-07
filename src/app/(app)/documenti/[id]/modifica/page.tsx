import { notFound } from "next/navigation";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDocumento } from "@/lib/documenti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";
import { DocumentoDeleteButton } from "@/components/documenti/DocumentoDeleteButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { getDocumentoUrl } from "@/lib/documenti/actions";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const d = await getDocumento(id);
  if (!d) notFound();
  const supabase = await createClient();
  const { data: clienti } = await supabase.from("clienti").select("id, nome").order("nome");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        area={`Documento · ${d.tipo.replace(/_/g, " ")}`}
        title="Modifica documento"
        subtitle="Aggiorna i dati o sostituisci il PDF. Se non carichi un nuovo file, l'attuale resta inalterato."
        actions={
          <>
            {d.file_path !== "pending" && <PdfDownloadButton getUrl={() => getDocumentoUrl(d.id)} label="Scarica" />}
            {isAdmin(profile) && <DocumentoDeleteButton id={d.id} />}
          </>
        }
      />
      <DocumentoForm documento={d} clienti={clienti ?? []} />
    </div>
  );
}
