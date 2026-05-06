import { requireProfile } from "@/lib/auth/session";
import { listClienti, type ClientiFilter } from "@/lib/clienti/queries";
import { toCsv } from "@/lib/csv/export";

export async function GET(req: Request) {
  await requireProfile();
  const url = new URL(req.url);
  const filter: ClientiFilter = {
    q: url.searchParams.get("q") ?? undefined,
    tipo: (url.searchParams.get("tipo") as "privato" | "azienda" | null) ?? undefined,
    commerciale_id: url.searchParams.get("commerciale_id") ?? undefined,
  };
  const rows = await listClienti(filter);

  const csv = toCsv(rows, [
    { header: "Tipo",         value: (r) => r.tipo_cliente },
    { header: "Nome",         value: (r) => r.nome },
    { header: "Email",        value: (r) => r.email ?? "" },
    { header: "Telefono",     value: (r) => r.telefono ?? "" },
    { header: "Indirizzo",    value: (r) => r.indirizzo ?? "" },
    { header: "Latitudine",   value: (r) => r.lat ?? "" },
    { header: "Longitudine",  value: (r) => r.lng ?? "" },
    { header: "Note",         value: (r) => r.note ?? "" },
    { header: "Commerciale",  value: (r) => r.commerciale_id ?? "" },
    { header: "Creato il",    value: (r) => r.created_at },
  ]);

  // BOM ﻿ helps Excel italiano detect UTF-8
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienti-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
