import { describe, it, expect } from "vitest";
import { clienteSchema } from "@/lib/validation/cliente-schema";

describe("clienteSchema", () => {
  it("accepts a minimal valid cliente", () => {
    const r = clienteSchema.safeParse({ tipo_cliente: "privato", nome: "Mario Rossi" });
    expect(r.success).toBe(true);
  });

  it("rejects nome too short", () => {
    const r = clienteSchema.safeParse({ tipo_cliente: "privato", nome: "M" });
    expect(r.success).toBe(false);
  });

  it("rejects only one of lat/lng", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 41.9, lng: null,
    });
    expect(r.success).toBe(false);
  });

  it("accepts both lat/lng valorizzate", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 41.9028, lng: 12.4964,
    });
    expect(r.success).toBe(true);
  });

  it("rejects lat out of range", () => {
    const r = clienteSchema.safeParse({
      tipo_cliente: "privato", nome: "Mario", lat: 200, lng: 12,
    });
    expect(r.success).toBe(false);
  });
});
