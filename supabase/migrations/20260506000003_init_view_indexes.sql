-- supabase/migrations/20260506000003_init_view_indexes.sql
BEGIN;

CREATE VIEW v_contratti
WITH (security_invoker = true) AS
SELECT
  c.*,
  (c.data_scadenza - CURRENT_DATE) AS giorni_alla_scadenza,
  (c.stato = 'attivo'
    AND c.data_scadenza <= CURRENT_DATE + INTERVAL '60 days'
    AND c.data_scadenza >= CURRENT_DATE) AS is_in_scadenza
FROM contratti c;

CREATE INDEX idx_clienti_commerciale_id ON clienti (commerciale_id);
CREATE INDEX idx_clienti_email          ON clienti (email);
CREATE INDEX idx_contratti_cliente_id   ON contratti (cliente_id);
CREATE INDEX idx_contratti_fornitore_id ON contratti (fornitore_id);
CREATE INDEX idx_contratti_stato        ON contratti (stato);
CREATE INDEX idx_contratti_scadenza     ON contratti (data_scadenza);
CREATE INDEX idx_documenti_cliente_id   ON documenti (cliente_id);
CREATE INDEX idx_documenti_scadenza     ON documenti (data_scadenza)
  WHERE data_scadenza IS NOT NULL;
CREATE INDEX idx_notifiche_log_entity   ON notifiche_log (entity_type, entity_id);

COMMIT;
