// tests/unit/documento-schema.test.ts
import { describe, it, expect } from "vitest";
import { documentoSchema } from "@/lib/validation/documento-schema";

const cliente_id = "123e4567-e89b-42d3-a456-426614174000";

describe("documentoSchema", () => {
  it("requires data_scadenza for carta_identita", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "carta_identita" });
    expect(r.success).toBe(false);
  });
  it("accepts carta_identita with data_scadenza", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "carta_identita", data_scadenza: "2030-01-01" });
    expect(r.success).toBe(true);
  });
  it("requires descrizione for tipo altro", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "altro" });
    expect(r.success).toBe(false);
  });
  it("accepts altro with descrizione", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "altro", descrizione: "Contratto extra" });
    expect(r.success).toBe(true);
  });
  it("accepts iban without scadenza", () => {
    const r = documentoSchema.safeParse({ cliente_id, tipo: "iban" });
    expect(r.success).toBe(true);
  });
});
