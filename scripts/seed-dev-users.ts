import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type SeedUser = { email: string; password: string; ruolo: "admin" | "commerciale" | "operatore"; nome: string };

const users: SeedUser[] = [
  { email: "admin@dev.local",       password: "Password123!", ruolo: "admin",       nome: "Admin Dev" },
  { email: "commerciale@dev.local", password: "Password123!", ruolo: "commerciale", nome: "Commerciale Dev" },
  { email: "operatore@dev.local",   password: "Password123!", ruolo: "operatore",   nome: "Operatore Dev" },
];

async function main() {
  const svc = createClient(url, serviceKey);
  for (const u of users) {
    const existing = await svc.auth.admin.listUsers();
    const found = existing.data.users.find((x) => x.email === u.email);
    if (found) {
      console.log(`skip ${u.email} (already exists)`);
      continue;
    }
    const { error } = await svc.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { ruolo: u.ruolo, nome_completo: u.nome },
    });
    if (error) {
      console.error(`fail ${u.email}: ${error.message}`);
      process.exit(1);
    }
    console.log(`ok ${u.email}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
