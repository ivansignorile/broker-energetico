// tests/unit/contratto-schema.test.ts
import { describe, it, expect } from "vitest";
import { contrattoSchema } from "@/lib/validation/contratto-schema";

const base = {
  cliente_id: "123e4567-e89b-42d3-a456-426614174000",
  fornitore_id: "0d8e7f12-5a9b-4c2e-9d6a-3f8b1c2d4e5f",
  categoria: "energia" as const,
  tipo: "luce" as const,
  data_inizio: "2026-01-01",
  data_scadenza: "2027-01-01",
  stato: "attivo" as const,
};

describe("contrattoSchema", () => {
  it("accepts a valid energia/luce contratto", () => {
    expect(contrattoSchema.safeParse(base).success).toBe(true);
  });
  it("rejects scadenza before inizio", () => {
    const r = contrattoSchema.safeParse({ ...base, data_inizio: "2026-12-01", data_scadenza: "2026-01-01" });
    expect(r.success).toBe(false);
  });
  it("rejects tipo incompatible with categoria", () => {
    const r = contrattoSchema.safeParse({ ...base, categoria: "rinnovabili", tipo: "luce" });
    expect(r.success).toBe(false);
  });
  it("accepts categoria/tipo coherent", () => {
    const r = contrattoSchema.safeParse({ ...base, categoria: "rinnovabili", tipo: "fotovoltaico" });
    expect(r.success).toBe(true);
  });
  it("rejects bad date format", () => {
    const r = contrattoSchema.safeParse({ ...base, data_inizio: "2026/01/01" });
    expect(r.success).toBe(false);
  });
});
