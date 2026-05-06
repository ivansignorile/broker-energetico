import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Ruolo } from "@/lib/supabase/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.attivo) redirect("/login?disabled=1");
  return profile;
}

export async function requireRole(...roles: Ruolo[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.ruolo)) redirect("/dashboard?forbidden=1");
  return profile;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.ruolo === "admin";
}
export function isCommerciale(profile: Profile | null): boolean {
  return profile?.ruolo === "commerciale";
}
export function isOperatore(profile: Profile | null): boolean {
  return profile?.ruolo === "operatore";
}
