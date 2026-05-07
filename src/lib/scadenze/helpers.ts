// src/lib/scadenze/helpers.ts
export type Soglia = 0 | 15 | 30 | 60;
export type ClasseScadenza = "scaduto" | "critica" | "imminente" | "vicina" | "futura";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Giorni dalla data odierna alla data di scadenza (negativi = scaduto). */
export function giorniAllaScadenza(dataScadenza: string | Date, today: Date = new Date()): number {
  const target = typeof dataScadenza === "string" ? new Date(dataScadenza) : dataScadenza;
  // Normalizza a midnight UTC per evitare drift orario
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((b - a) / MS_PER_DAY);
}

/** Classifica la scadenza in 5 livelli per UI. */
export function classificaScadenza(giorni: number): ClasseScadenza {
  if (giorni < 0) return "scaduto";
  if (giorni <= 15) return "critica";
  if (giorni <= 30) return "imminente";
  if (giorni <= 60) return "vicina";
  return "futura";
}

/** Per cron digest: ritorna 0/15/30/60 SOLO se giorni == soglia esatta. Altrimenti null. */
export function sogliaEsatta(giorni: number): Soglia | null {
  if (giorni === 0) return 0;
  if (giorni === 15) return 15;
  if (giorni === 30) return 30;
  if (giorni === 60) return 60;
  return null;
}
