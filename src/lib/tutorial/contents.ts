export type TutorialStep = {
  title: string;
  body: string;
  hint?: string;
};

export type TutorialContent = {
  /** chiave stabile per localStorage */
  key: string;
  /** label area (mostrata in mono-label) */
  area: string;
  /** titolo del modale */
  title: string;
  steps: TutorialStep[];
};

const dashboard: TutorialContent = {
  key: "dashboard",
  area: "Dashboard",
  title: "Benvenuto nel gestionale",
  steps: [
    {
      title: "Una panoramica al volo",
      body: "Da qui hai sempre sott'occhio numeri totali, contratti attivi e scadenze in arrivo. È il punto di partenza ogni mattina.",
    },
    {
      title: "I numeri principali",
      body: "Le 4 card in alto mostrano clienti totali, contratti attivi, contratti in scadenza nei prossimi 60 giorni e documenti in scadenza. Cliccaci sopra per saltare alla lista filtrata.",
    },
    {
      title: "Le scadenze imminenti",
      body: "La sezione \"Scadenze imminenti\" elenca contratti e documenti dei prossimi 60 giorni, ordinati per urgenza. I badge colorati ti dicono quanto manca: rosso = critica, arancio = 30 giorni, blu = vicina.",
    },
    {
      title: "Naviga dalla barra a sinistra",
      body: "Da lì raggiungi clienti, contratti, documenti e fornitori. La sezione amministrazione (utenti e impostazioni) è visibile solo agli admin.",
      hint: "Il digest email arriva automaticamente ogni mattina alle 08:00 a chi è coinvolto sulle scadenze.",
    },
  ],
};

const clienti: TutorialContent = {
  key: "clienti",
  area: "Clienti",
  title: "La tua rubrica clienti",
  steps: [
    {
      title: "Ricerca e filtri",
      body: "Usa la barra di ricerca per trovare un cliente per nome, email o telefono. Filtra per tipologia (privato/azienda) o per commerciale assegnato.",
    },
    {
      title: "Crea un cliente",
      body: "Tocca \"Nuovo cliente\" in alto a destra. Compila almeno tipologia e nome (per le aziende: ragione sociale). Email, telefono e indirizzo sono opzionali ma molto utili.",
      hint: "Se compili l'indirizzo, al salvataggio l'app cerca automaticamente lat/lng e mostra il marker sulla mappa.",
    },
    {
      title: "Scheda cliente",
      body: "Cliccando un cliente vedi anagrafica, mappa, e in fondo le sezioni Contratti e Documenti collegati. Da lì puoi creare un nuovo contratto o caricare un documento preselezionando il cliente.",
    },
    {
      title: "Esporta in CSV",
      body: "Il bottone \"Esporta CSV\" scarica la lista filtrata, separatore \";\" e BOM UTF-8: si apre direttamente in Excel italiano.",
    },
  ],
};

const clienteDettaglio: TutorialContent = {
  key: "cliente-detail",
  area: "Scheda cliente",
  title: "Tutto sul cliente in una pagina",
  steps: [
    {
      title: "Anagrafica e mappa",
      body: "In alto trovi i dati di contatto. La mappa mostra la posizione (se hai compilato l'indirizzo). Se le coordinate sono sbagliate, modifica e correggile a mano: la mappa si aggiorna al salvataggio.",
    },
    {
      title: "Contratti del cliente",
      body: "La sezione Contratti elenca tutti i contratti collegati, con stato e scadenza. Tocca \"Nuovo\" per crearne uno con il cliente già preselezionato.",
    },
    {
      title: "Documenti del cliente",
      body: "Carica documenti d'identità, visure, mandati: \"Carica\" apre il form con cliente preselezionato. I documenti d'identità con scadenza vanno nel digest automatico.",
    },
  ],
};

const contratti: TutorialContent = {
  key: "contratti",
  area: "Contratti",
  title: "I contratti del tuo portafoglio",
  steps: [
    {
      title: "Lista globale e filtri",
      body: "Vedi tutti i contratti con cliente, fornitore, tipo, stato e scadenza. Filtra per stato (es. solo attivi), cliente specifico, fornitore o quanti giorni mancano alla scadenza.",
    },
    {
      title: "Crea un contratto",
      body: "Scegli cliente, fornitore, categoria (energia/rinnovabili/...) e tipo. Il form mostra POD per la luce, PDR per il gas, entrambi per il dual fuel. Allega il PDF firmato (opzionale).",
      hint: "Il PDF viene caricato in uno spazio privato. Solo chi ha accesso al cliente può scaricarlo, e con link a tempo (60 secondi).",
    },
    {
      title: "Rinnova un contratto",
      body: "Aprendo un contratto attivo trovi il bottone \"Rinnova\": crea un nuovo contratto con stesso cliente/fornitore/tipo e nuove date. Il vecchio resta visibile come storico.",
    },
    {
      title: "Stati a colpo d'occhio",
      body: "I badge ti dicono lo stato (bozza, attivo, scaduto, rinnovato, annullato) e quanti giorni mancano alla scadenza per i contratti attivi.",
    },
  ],
};

const contrattoDettaglio: TutorialContent = {
  key: "contratto-detail",
  area: "Scheda contratto",
  title: "Cosa vedi qui",
  steps: [
    {
      title: "Dati del contratto",
      body: "Cliente, fornitore, categoria/tipo, mercato, POD/PDR, date e note. Tocca \"Modifica\" per cambiare qualsiasi campo o sostituire l'allegato PDF.",
    },
    {
      title: "Allegato e storico",
      body: "Sulla destra: scarica l'allegato (link firmato 60s) e vedi i contratti precedenti (rinnovi). Se questo è stato a sua volta sostituito, c'è il link \"apri rinnovo\".",
    },
    {
      title: "Rinnovo e cancellazione",
      body: "\"Rinnova\" è disponibile per i contratti attivi. La cancellazione è riservata agli admin: in genere è meglio cambiare lo stato a \"annullato\" per mantenere lo storico.",
    },
  ],
};

const documenti: TutorialContent = {
  key: "documenti",
  area: "Documenti",
  title: "Documenti collegati ai clienti",
  steps: [
    {
      title: "Vista globale",
      body: "Qui vedi tutti i documenti caricati con cliente, tipo, scadenza. Filtra per finestra di scadenza per trovare quelli più urgenti.",
    },
    {
      title: "Caricare un documento",
      body: "Si carica dalla scheda del cliente: vai sul cliente → sezione Documenti → \"Carica\". Per carta d'identità, passaporto, patente, permesso di soggiorno e visura camerale la data di scadenza è obbligatoria.",
      hint: "Solo PDF, massimo 10 MB. La scadenza alimenta automaticamente il digest email a 60/30/15/0 giorni.",
    },
    {
      title: "Modifica e download",
      body: "Cliccando un documento puoi cambiarne i dati, sostituire il PDF, scaricare l'originale (link firmato 60s) o eliminarlo (admin only).",
    },
  ],
};

const fornitori: TutorialContent = {
  key: "fornitori",
  area: "Fornitori",
  title: "I tuoi fornitori",
  steps: [
    {
      title: "Lista fornitori",
      body: "Tutti i fornitori con cui collabori, con referente, contatti e stato (attivo/disattivato). I commerciali e gli operatori vedono i fornitori in sola lettura.",
    },
    {
      title: "Aggiungi e modifica (admin)",
      body: "Solo gli admin possono creare/modificare/eliminare fornitori. Per disattivarne uno temporaneamente senza perdere lo storico, usa il toggle \"Fornitore attivo\".",
    },
  ],
};

const utenti: TutorialContent = {
  key: "utenti",
  area: "Utenti",
  title: "Gli utenti del gestionale (admin)",
  steps: [
    {
      title: "Tre ruoli, tre permessi",
      body: "Admin: tutto. Operatore: vede tutti i clienti, può modificare e gestire scadenze. Commerciale: vede solo i propri clienti (e quelli senza commerciale assegnato).",
    },
    {
      title: "Invita un nuovo utente",
      body: "\"Invita utente\" manda un'email con un link di setup password. L'utente sceglie la password al primo accesso e atterra in dashboard.",
      hint: "Il ruolo lo decidi tu in fase di invito. Per cambiarlo dopo, intervieni dal Supabase Studio (gestione admin pianificata in roadmap).",
    },
  ],
};

const impostazioni: TutorialContent = {
  key: "impostazioni",
  area: "Impostazioni",
  title: "Operazioni di sistema (admin)",
  steps: [
    {
      title: "Trigger manuale digest",
      body: "Il digest scadenze gira automaticamente alle 08:00 ogni mattina. Se vuoi inviarlo subito (ad es. dopo aver caricato dati nuovi), tocca \"Invia digest ora\".",
    },
    {
      title: "Storico job automatici",
      body: "La tabella in basso mostra gli ultimi 20 run dei job (digest giornaliero e backup PDF settimanale): orario, esito, riepilogo numerico.",
    },
  ],
};

const REGISTRY: TutorialContent[] = [
  dashboard,
  clienti,
  clienteDettaglio,
  contratti,
  contrattoDettaglio,
  documenti,
  fornitori,
  utenti,
  impostazioni,
];

/** Ritorna il tutorial associato al pathname corrente, oppure null se la sezione non è coperta. */
export function getTutorialForPath(pathname: string): TutorialContent | null {
  // ordine: rotte più specifiche prima di quelle generiche
  if (/^\/clienti\/[^/]+\/(modifica|documenti)/.test(pathname)) return clienteDettaglio;
  if (/^\/clienti\/[^/]+$/.test(pathname)) return clienteDettaglio;
  if (pathname.startsWith("/clienti")) return clienti;
  if (/^\/contratti\/[^/]+\/modifica/.test(pathname)) return contrattoDettaglio;
  if (/^\/contratti\/[^/]+$/.test(pathname)) return contrattoDettaglio;
  if (pathname.startsWith("/contratti")) return contratti;
  if (pathname.startsWith("/documenti")) return documenti;
  if (pathname.startsWith("/fornitori")) return fornitori;
  if (pathname.startsWith("/utenti")) return utenti;
  if (pathname.startsWith("/impostazioni")) return impostazioni;
  if (pathname.startsWith("/dashboard")) return dashboard;
  return null;
}

export const ALL_TUTORIALS = REGISTRY;
