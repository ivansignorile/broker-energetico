import { requireRole } from "@/lib/auth/session";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default async function Page() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo fornitore</h1>
      <FornitoreForm />
    </div>
  );
}
