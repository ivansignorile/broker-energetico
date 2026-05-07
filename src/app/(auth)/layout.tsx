import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Hero side — only visible on desktop */}
      <aside className="hidden cohere-surface-near-black p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: "var(--cohere-deep-green)" }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">Broker</p>
            <p className="cohere-mono-label" style={{ color: "rgba(255,255,255,0.55)" }}>energetico</p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="cohere-mono-label" style={{ color: "var(--cohere-coral)" }}>Gestionale 2026</p>
          <h1 className="cohere-display max-w-md text-5xl text-white">
            Le scadenze<br />
            non ti<br />
            sfuggono più.
          </h1>
          <p className="max-w-sm text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Clienti, contratti, documenti, fornitori. Tutto in un posto, con notifiche automatiche per
            ricordarti rinnovi e documenti d&apos;identità in scadenza.
          </p>
        </div>

        <p className="cohere-mono-label" style={{ color: "rgba(255,255,255,0.4)" }}>
          Barikreativa · Made in Italy
        </p>
      </aside>

      {/* Form side */}
      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
