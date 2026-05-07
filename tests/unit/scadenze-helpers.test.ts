// tests/unit/scadenze-helpers.test.ts
import { describe, it, expect } from "vitest";
import { giorniAllaScadenza, classificaScadenza, sogliaEsatta } from "@/lib/scadenze/helpers";

describe("giorniAllaScadenza", () => {
  it("0 if same day", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-05-07", today)).toBe(0);
  });
  it("positive if future", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-06-06", today)).toBe(30);
  });
  it("negative if past", () => {
    const today = new Date("2026-05-07T10:00:00Z");
    expect(giorniAllaScadenza("2026-05-01", today)).toBe(-6);
  });
});

describe("classificaScadenza", () => {
  it("scaduto for negative", () => expect(classificaScadenza(-1)).toBe("scaduto"));
  it("critica for 0-15", () => {
    expect(classificaScadenza(0)).toBe("critica");
    expect(classificaScadenza(15)).toBe("critica");
  });
  it("imminente for 16-30", () => {
    expect(classificaScadenza(16)).toBe("imminente");
    expect(classificaScadenza(30)).toBe("imminente");
  });
  it("vicina for 31-60", () => {
    expect(classificaScadenza(31)).toBe("vicina");
    expect(classificaScadenza(60)).toBe("vicina");
  });
  it("futura for >60", () => expect(classificaScadenza(61)).toBe("futura"));
});

describe("sogliaEsatta", () => {
  it("matches exact thresholds", () => {
    expect(sogliaEsatta(0)).toBe(0);
    expect(sogliaEsatta(15)).toBe(15);
    expect(sogliaEsatta(30)).toBe(30);
    expect(sogliaEsatta(60)).toBe(60);
  });
  it("null otherwise", () => {
    expect(sogliaEsatta(1)).toBeNull();
    expect(sogliaEsatta(45)).toBeNull();
    expect(sogliaEsatta(-1)).toBeNull();
  });
});
