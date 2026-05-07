// src/lib/email/templates/DigestEmail.tsx
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

export type DigestItem = {
  entity_type: "contratto" | "documento";
  entity_id: string;
  soglia: 0 | 15 | 30 | 60;
  cliente_nome: string;
  detail: string; // es. "Luce - Enel Energia" o "Carta identità"
  data_scadenza: string;
  url: string; // link nell'app
};

const SOGLIA_LABEL: Record<0 | 15 | 30 | 60, string> = {
  0: "Oggi",
  15: "Tra 15 giorni",
  30: "Tra 30 giorni",
  60: "Tra 60 giorni",
};

const SOGLIA_COLOR: Record<0 | 15 | 30 | 60, string> = {
  0: "#dc2626",   // rosso
  15: "#ea580c",  // arancio
  30: "#ca8a04",  // giallo
  60: "#16a34a",  // verde
};

export function DigestEmail({
  destinatario, items, appUrl,
}: {
  destinatario: string;
  items: DigestItem[];
  appUrl: string;
}) {
  const grouped: Record<0 | 15 | 30 | 60, DigestItem[]> = { 0: [], 15: [], 30: [], 60: [] };
  for (const it of items) grouped[it.soglia].push(it);

  return (
    <Html>
      <Head />
      <Preview>{`Scadenze del giorno · ${items.length} elementi`}</Preview>
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f5f5f5", padding: 24 }}>
        <Container style={{ maxWidth: 640, backgroundColor: "#fff", padding: 32, borderRadius: 8 }}>
          <Heading as="h1" style={{ fontSize: 22, marginTop: 0 }}>Scadenze del giorno</Heading>
          <Text style={{ fontSize: 14, color: "#525252" }}>
            {`Ciao ${destinatario}, ci sono ${items.length} scadenze nelle prossime soglie:`}
          </Text>

          {([0, 15, 30, 60] as const).map((soglia) => {
            const list = grouped[soglia];
            if (list.length === 0) return null;
            return (
              <Section key={soglia} style={{ marginTop: 24 }}>
                <Heading as="h2" style={{ fontSize: 16, color: SOGLIA_COLOR[soglia], borderBottom: `2px solid ${SOGLIA_COLOR[soglia]}`, paddingBottom: 4 }}>
                  {`${SOGLIA_LABEL[soglia]} (${list.length})`}
                </Heading>
                {list.map((it) => (
                  <div key={`${it.entity_type}-${it.entity_id}`} style={{ padding: "10px 0", borderBottom: "1px solid #e5e5e5" }}>
                    <Text style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{it.cliente_nome}</Text>
                    <Text style={{ margin: 0, fontSize: 13, color: "#525252" }}>
                      {it.entity_type === "contratto" ? "Contratto" : "Documento"} · {it.detail} · scade il {it.data_scadenza}
                    </Text>
                    <Link href={it.url} style={{ fontSize: 12, color: "#1d4ed8" }}>Apri nell&apos;app →</Link>
                  </div>
                ))}
              </Section>
            );
          })}

          <Hr style={{ marginTop: 32, borderColor: "#e5e5e5" }} />
          <Section style={{ textAlign: "center", marginTop: 16 }}>
            <Button href={appUrl} style={{ backgroundColor: "#1d4ed8", color: "#fff", padding: "10px 16px", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>
              Vai alla dashboard
            </Button>
          </Section>
          <Text style={{ fontSize: 11, color: "#a3a3a3", textAlign: "center", marginTop: 24 }}>
            Email automatica del gestionale broker. Per dubbi, rispondi a questa email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
