// src/lib/email/resend.ts
import { Resend } from "resend";

let client: Resend | null = null;

export function resend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    client = new Resend(key);
  }
  return client;
}

export type SendEmailOpts = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
};

export async function sendEmail(opts: SendEmailOpts): Promise<{ id: string } | { error: string }> {
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;
  if (!from) return { error: "RESEND_FROM_EMAIL not configured" };

  try {
    const r = await resend().emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
      replyTo: replyTo ? replyTo : undefined,
    });
    if (r.error) return { error: r.error.message };
    return { id: r.data?.id ?? "unknown" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Errore invio email" };
  }
}
