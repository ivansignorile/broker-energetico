import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geocodeAddress, geocodeOrLog } from "./nominatim";

const ORIGINAL_ENV = process.env.NOMINATIM_USER_AGENT;

beforeEach(() => {
  process.env.NOMINATIM_USER_AGENT = "test/1.0";
});
afterEach(() => {
  process.env.NOMINATIM_USER_AGENT = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

describe("geocodeAddress", () => {
  it("returns null for empty/short input", async () => {
    expect(await geocodeAddress("")).toBeNull();
    expect(await geocodeAddress(" ab ")).toBeNull();
  });

  it("returns lat/lng on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(
      JSON.stringify([{ lat: "41.9028", lon: "12.4964" }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    const r = await geocodeAddress("Roma");
    expect(r).toEqual({ lat: 41.9028, lng: 12.4964 });
  });

  it("returns null on empty result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));
    expect(await geocodeAddress("zzzzz nonexistent place 12345")).toBeNull();
  });

  it("returns null on non-200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    expect(await geocodeAddress("Roma")).toBeNull();
  });

  it("throws if NOMINATIM_USER_AGENT missing", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    await expect(geocodeAddress("Roma")).rejects.toThrow();
  });
});

describe("geocodeOrLog", () => {
  it("returns null instead of throwing when env missing", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    expect(await geocodeOrLog("Roma")).toBeNull();
  });
});
