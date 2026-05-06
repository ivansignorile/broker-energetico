-- supabase/migrations/20260506000001_init_enums.sql
BEGIN;

CREATE TYPE ruolo AS ENUM ('admin', 'commerciale', 'operatore');

CREATE TYPE tipo_cliente AS ENUM ('privato', 'azienda');

CREATE TYPE mercato AS ENUM ('libero', 'tutelato');

CREATE TYPE stato_contratto AS ENUM (
  'bozza', 'attivo', 'scaduto', 'rinnovato', 'annullato'
);

CREATE TYPE categoria_contratto AS ENUM (
  'energia', 'rinnovabili', 'riscaldamento', 'utility', 'servizi'
);

CREATE TYPE tipo_contratto AS ENUM (
  'luce', 'gas', 'dual_fuel',
  'fotovoltaico', 'accumulo', 'comunita_energetica', 'ricarica_ev',
  'teleriscaldamento', 'gpl', 'pellet',
  'idrico', 'internet_fibra', 'telefonia',
  'efficienza_energetica', 'diagnosi_energetica',
  'manutenzione', 'assicurativo'
);

CREATE TYPE tipo_documento AS ENUM (
  'carta_identita', 'passaporto', 'patente', 'permesso_soggiorno',
  'codice_fiscale', 'tessera_sanitaria', 'partita_iva',
  'visura_camerale', 'certificato_attribuzione_piva',
  'bolletta_recente', 'delega_voltura', 'mandato_consulenza',
  'privacy_gdpr', 'iban', 'rid_sepa',
  'altro'
);

COMMIT;
