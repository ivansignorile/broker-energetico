// src/app/api/cron/weekly-backup/route.ts
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { runWeeklyBackup } from "@/lib/cron/backup";
import { logCronRun } from "@/lib/cron/runs";

export const dynamic = "force-dynamic";
export const maxDuration = 800; // ~13 min, fluid compute consente fino a 800s

export async function GET(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const summary = await runWeeklyBackup();
    await logCronRun("weekly-backup", summary.errori.length === 0, summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const errore = err instanceof Error ? err.message : "errore generico";
    await logCronRun("weekly-backup", false, { errore });
    return NextResponse.json({ ok: false, error: errore }, { status: 500 });
  }
}
