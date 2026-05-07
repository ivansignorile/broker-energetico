// src/app/(app)/documenti/[id]/modifica/page.tsx
import { notFound } from "next/navigation";
import { requireProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getDocumento } from "@/lib/documenti/queries";
import { DocumentoForm } from "@/components/documenti/DocumentoForm";
import { DocumentoDeleteButton } from "@/components/documenti/DocumentoDeleteButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { getDocumentoUrl } from "@/lib/documenti/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const d = await getDocumento(id);
  if (!d) notFound();
  const supabase = await createClient();
  const { data: clienti } = await supabase.from("clienti").select("id, nome").order("nome");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modifica documento</h1>
        <div className="flex items-center gap-2">
          {d.file_path !== "pending" && <PdfDownloadButton getUrl={() => getDocumentoUrl(d.id)} label="Scarica" />}
          {isAdmin(profile) && <DocumentoDeleteButton id={d.id} />}
        </div>
      </div>
      <DocumentoForm documento={d} clienti={clienti ?? []} />
    </div>
  );
}
