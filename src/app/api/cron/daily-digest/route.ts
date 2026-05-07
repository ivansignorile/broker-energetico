// src/app/api/cron/daily-digest/route.ts
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { runDailyDigest } from "@/lib/cron/digest";
import { logCronRun } from "@/lib/cron/runs";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min

export async function GET(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const summary = await runDailyDigest();
    await logCronRun("daily-digest", summary.errori.length === 0, summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const errore = err instanceof Error ? err.message : "errore generico";
    await logCronRun("daily-digest", false, { errore });
    return NextResponse.json({ ok: false, error: errore }, { status: 500 });
  }
}

// Permetti anche POST (Vercel Cron usa GET ma il trigger manuale userà POST)
export async function POST(req: Request) {
  return GET(req);
}
