import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getFornitore } from "@/lib/fornitori/queries";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const f = await getFornitore(id);
  if (!f) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifica {f.nome}</h1>
      <FornitoreForm fornitore={f} />
    </div>
  );
}
