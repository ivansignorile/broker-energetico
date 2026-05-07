// src/lib/cron/digest.ts
import { createServiceClient } from "@/lib/supabase/service";
import { sogliaEsatta, giorniAllaScadenza } from "@/lib/scadenze/helpers";
import { DigestEmail, type DigestItem } from "@/lib/email/templates/DigestEmail";
import { sendEmail } from "@/lib/email/resend";

type Soglia = 0 | 15 | 30 | 60;

export type DigestSummary = {
  utenti_notificati: number;
  email_inviate: number;
  email_skippate: number;
  errori: { utente: string; errore: string }[];
};

/**
 * Pipeline:
 * 1. Carica contratti attivi con scadenza in {oggi, +15, +30, +60}
 * 2. Carica documenti con data_scadenza non null nelle stesse soglie
 * 3. Per ogni utente attivo (admin/operatore: tutto; commerciale: solo suoi clienti)
 *    Filtra idempotenza via notifiche_log
 *    Se almeno 1 nuovo → render + invio + INSERT notifiche_log
 */
export async function runDailyDigest(today: Date = new Date()): Promise<DigestSummary> {
  const svc = createServiceClient();
  const summary: DigestSummary = { utenti_notificati: 0, email_inviate: 0, email_skippate: 0, errori: [] };

  // Soglie
  const targetDates = ([0, 15, 30, 60] as const).map((s) => {
    const d = new Date(today);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + s);
    return d.toISOString().slice(0, 10);
  });

  // Fetch contratti attivi nelle date soglia
  const { data: contratti } = await svc
    .from("contratti")
    .select("id, cliente_id, fornitore_id, tipo, data_scadenza, stato")
    .eq("stato", "attivo")
    .in("data_scadenza", targetDates);

  // Fetch documenti
  const { data: documenti } = await svc
    .from("documenti")
    .select("id, cliente_id, tipo, descrizione, data_scadenza")
    .not("data_scadenza", "is", null)
    .in("data_scadenza", targetDates);

  // Fetch lookups
  const [{ data: clienti }, { data: fornitori }, { data: profiles }] = await Promise.all([
    svc.from("clienti").select("id, nome, commerciale_id"),
    svc.from("fornitori").select("id, nome"),
    svc.from("profiles").select("id, ruolo, nome_completo, email, attivo").eq("attivo", true),
  ]);

  const clientiMap = new Map((clienti ?? []).map((c) => [c.id, c]));
  const fornitoriMap = new Map((fornitori ?? []).map((f) => [f.id, f.nome]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  type Item = DigestItem & { _cliente_id: string };

  // Costruisci items globali
  const allItems: Item[] = [];
  for (const c of contratti ?? []) {
    const giorni = giorniAllaScadenza(c.data_scadenza, today);
    const soglia = sogliaEsatta(giorni);
    if (soglia === null) continue;
    const cliente = clientiMap.get(c.cliente_id);
    if (!cliente) continue;
    const fornitore = fornitoriMap.get(c.fornitore_id) ?? "?";
    allItems.push({
      entity_type: "contratto",
      entity_id: c.id,
      soglia,
      cliente_nome: cliente.nome,
      detail: `${c.tipo} · ${fornitore}`,
      data_scadenza: c.data_scadenza,
      url: `${appUrl}/contratti/${c.id}`,
      _cliente_id: c.cliente_id,
    });
  }

  for (const d of documenti ?? []) {
    if (!d.data_scadenza) continue;
    const giorni = giorniAllaScadenza(d.data_scadenza, today);
    const soglia = sogliaEsatta(giorni);
    if (soglia === null) continue;
    const cliente = clientiMap.get(d.cliente_id);
    if (!cliente) continue;
    allItems.push({
      entity_type: "documento",
      entity_id: d.id,
      soglia,
      cliente_nome: cliente.nome,
      detail: `${d.tipo.replace(/_/g, " ")}${d.descrizione ? ` · ${d.descrizione}` : ""}`,
      data_scadenza: d.data_scadenza,
      url: `${appUrl}/documenti/${d.id}/modifica`,
      _cliente_id: d.cliente_id,
    });
  }

  if (allItems.length === 0) return summary;

  // Per ogni utente attivo, filtra items rilevanti
  for (const user of profiles ?? []) {
    const items: Item[] = user.ruolo === "commerciale"
      ? allItems.filter((it) => clientiMap.get(it._cliente_id)?.commerciale_id === user.id)
      : allItems;
    if (items.length === 0) continue;

    // Idempotency: skippa items già notificati
    const candidati = items.map((it) => ({
      entity_type: it.entity_type,
      entity_id: it.entity_id,
      soglia: it.soglia,
      recipient_email: user.email,
    }));

    const { data: giaInviati } = await svc
      .from("notifiche_log")
      .select("entity_type, entity_id, soglia")
      .eq("recipient_email", user.email)
      .in("entity_id", candidati.map((c) => c.entity_id));

    const giaInviatiSet = new Set(
      (giaInviati ?? []).map((g) => `${g.entity_type}-${g.entity_id}-${g.soglia}`)
    );

    const nuovi = items.filter((it) => !giaInviatiSet.has(`${it.entity_type}-${it.entity_id}-${it.soglia}`));
    if (nuovi.length === 0) {
      summary.email_skippate += 1;
      continue;
    }

    // Render + invio
    try {
      const send = await sendEmail({
        to: user.email,
        subject: `Scadenze del giorno · ${nuovi.filter((n) => n.entity_type === "contratto").length} contratti, ${nuovi.filter((n) => n.entity_type === "documento").length} documenti`,
        react: DigestEmail({ destinatario: user.nome_completo, items: nuovi, appUrl }),
      });
      if ("error" in send) {
        summary.errori.push({ utente: user.email, errore: send.error });
        continue;
      }

      // Persist log (ignora duplicati per safety)
      await svc.from("notifiche_log").insert(nuovi.map((n) => ({
        entity_type: n.entity_type,
        entity_id: n.entity_id,
        soglia: n.soglia,
        recipient_email: user.email,
      })));

      summary.email_inviate += 1;
      summary.utenti_notificati += 1;
    } catch (err) {
      summary.errori.push({ utente: user.email, errore: err instanceof Error ? err.message : "errore" });
    }
  }

  return summary;
}
