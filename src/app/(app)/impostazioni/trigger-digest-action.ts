"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { runDailyDigest } from "@/lib/cron/digest";
import { logCronRun } from "@/lib/cron/runs";

export type TriggerResult =
  | { ok: true; summary: { utenti_notificati: number; email_inviate: number; email_skippate: number; errori: number } }
  | { ok: false; error: string };

export async function triggerDigest(): Promise<TriggerResult> {
  await requireRole("admin");
  try {
    const summary = await runDailyDigest();
    await logCronRun("daily-digest-manual", summary.errori.length === 0, summary);
    revalidatePath("/impostazioni");
    return {
      ok: true,
      summary: {
        utenti_notificati: summary.utenti_notificati,
        email_inviate: summary.email_inviate,
        email_skippate: summary.email_skippate,
        errori: summary.errori.length,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "errore generico" };
  }
}
