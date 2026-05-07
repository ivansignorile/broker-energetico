// src/lib/cron/runs.ts
import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

export type CronRunSummary = Record<string, unknown>;

export async function logCronRun(jobName: string, ok: boolean, summary: CronRunSummary): Promise<void> {
  const svc = createServiceClient();
  await svc.from("cron_runs").insert({ job_name: jobName, ok, summary: summary as Json });
}

export async function listRecentCronRuns(limit = 20) {
  const svc = createServiceClient();
  const { data } = await svc.from("cron_runs").select("*").order("run_at", { ascending: false }).limit(limit);
  return data ?? [];
}
