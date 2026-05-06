import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function Page() {
  // Quando arriva dal link Supabase, l'utente è già loggato (token nell'URL processato dal client SDK).
  // Il form aggiorna semplicemente la password.
  return <ResetPasswordForm title="Imposta la tua password" />;
}
