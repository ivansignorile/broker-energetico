import { describe, it, expect } from "vitest";
import { isAdmin, isCommerciale, isOperatore } from "./session";
import type { Profile } from "@/lib/supabase/types";

const mk = (ruolo: Profile["ruolo"]): Profile => ({
  id: "x", ruolo, nome_completo: "x", email: "x@x.x", attivo: true,
  created_at: "", updated_at: "",
});

describe("session predicates", () => {
  it("isAdmin true only for admin", () => {
    expect(isAdmin(mk("admin"))).toBe(true);
    expect(isAdmin(mk("commerciale"))).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("isCommerciale", () => {
    expect(isCommerciale(mk("commerciale"))).toBe(true);
    expect(isCommerciale(mk("admin"))).toBe(false);
  });

  it("isOperatore", () => {
    expect(isOperatore(mk("operatore"))).toBe(true);
    expect(isOperatore(mk("admin"))).toBe(false);
  });
});
