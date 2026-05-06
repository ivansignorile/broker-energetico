// tests/rls/helpers.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL =
  process.env.TEST_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.TEST_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type Ruolo = "admin" | "commerciale" | "operatore";

export type TestUser = {
  id: string;
  email: string;
  password: string;
  ruolo: Ruolo;
  client: SupabaseClient;
};

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(ruolo: Ruolo): Promise<TestUser> {
  const id = randomUUID();
  const email = `test-${id}@example.com`;
  const password = "Password123!";
  const admin = adminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { ruolo, nome_completo: `Test ${ruolo} ${id.slice(0, 6)}` },
  });
  if (error) throw error;
  if (!data.user) throw new Error("user not created");

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { id: data.user.id, email, password, ruolo, client };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function resetData(): Promise<void> {
  const admin = adminClient();
  await admin.from("notifiche_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("documenti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("contratti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("clienti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("fornitori").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
