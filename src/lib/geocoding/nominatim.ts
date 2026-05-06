const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = { lat: number; lng: number } | null;

const TIMEOUT_MS = 5000;

export async function geocodeAddress(indirizzo: string): Promise<GeocodeResult> {
  if (!indirizzo || indirizzo.trim().length < 3) return null;

  const userAgent = process.env.NOMINATIM_USER_AGENT;
  if (!userAgent) {
    throw new Error("NOMINATIM_USER_AGENT env var not set");
  }

  const params = new URLSearchParams({
    q: indirizzo,
    format: "json",
    limit: "1",
    countrycodes: "it",
    addressdetails: "0",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodeOrLog(indirizzo: string): Promise<GeocodeResult> {
  try {
    return await geocodeAddress(indirizzo);
  } catch (err) {
    console.warn("[geocoding] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
