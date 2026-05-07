// src/lib/cron/auth.ts
export type CronAuthResult = { ok: true } | { ok: false; status: number; error: string };

export function verifyCronAuth(req: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  if (!expected) return { ok: false, status: 500, error: "CRON_SECRET not configured" };

  const auth = req.headers.get("authorization");
  if (!auth) return { ok: false, status: 401, error: "Missing authorization" };

  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return { ok: false, status: 401, error: "Invalid scheme" };

  // Constant-time compare to avoid timing attacks
  if (token.length !== expected.length) return { ok: false, status: 401, error: "Invalid token" };
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  if (mismatch !== 0) return { ok: false, status: 401, error: "Invalid token" };
  return { ok: true };
}
