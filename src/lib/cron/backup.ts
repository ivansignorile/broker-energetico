// src/lib/cron/backup.ts
import { createServiceClient } from "@/lib/supabase/service";
import { listB2Objects, uploadToB2 } from "@/lib/storage/b2";

export type BackupSummary = {
  totale_supabase: number;
  gia_in_b2: number;
  caricati: number;
  errori: { path: string; errore: string }[];
};

const SUPABASE_BUCKET = "documents";

export async function runWeeklyBackup(): Promise<BackupSummary> {
  const summary: BackupSummary = { totale_supabase: 0, gia_in_b2: 0, caricati: 0, errori: [] };
  const svc = createServiceClient();

  // 1. Lista tutti i file Supabase Storage (ricorsivo)
  const supabaseFiles = await listSupabaseRecursive(svc, SUPABASE_BUCKET, "");
  summary.totale_supabase = supabaseFiles.length;

  // 2. Lista B2
  const b2Files = await listB2Objects();
  const b2Set = new Set(b2Files.map((f) => f.key));

  // 3. Upload incrementale
  for (const path of supabaseFiles) {
    if (b2Set.has(path)) {
      summary.gia_in_b2 += 1;
      continue;
    }
    try {
      const { data: blob } = await svc.storage.from(SUPABASE_BUCKET).download(path);
      if (!blob) {
        summary.errori.push({ path, errore: "download blob null" });
        continue;
      }
      const buffer = Buffer.from(await blob.arrayBuffer());
      await uploadToB2(path, buffer, "application/pdf");
      summary.caricati += 1;
    } catch (err) {
      summary.errori.push({ path, errore: err instanceof Error ? err.message : "errore" });
    }
  }

  return summary;
}

async function listSupabaseRecursive(svc: ReturnType<typeof createServiceClient>, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await svc.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const entry of data ?? []) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null && entry.name) {
      // Cartella
      const sub = await listSupabaseRecursive(svc, bucket, fullPath);
      out.push(...sub);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}
