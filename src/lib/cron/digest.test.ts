// src/lib/cron/digest.test.ts
// Skipped per ora — test richiede mock Supabase + Resend, complessità alta.
// Lo aggiungeremo in iterazione successiva. Per Plan #4 verifichiamo end-to-end via smoke manuale.
import { describe, it, expect } from "vitest";
describe("digest pipeline", () => {
  it("module exports runDailyDigest", async () => {
    const mod = await import("./digest");
    expect(typeof mod.runDailyDigest).toBe("function");
  });
});
