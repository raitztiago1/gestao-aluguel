-- Verificação do histórico Flyway (Gestão de Aluguel)
-- Versões esperadas em fresh install: 1, 3, 4, 5, 6 (V2 ausente intencionalmente)
--
-- Execução local:
--   psql -h localhost -U postgres -d gestao_aluguel -f scripts/dev/check-flyway-history.sql
-- Execução Docker:
--   Get-Content scripts/dev/check-flyway-history.sql | docker exec -i gestao-aluguel-db psql -U postgres -d gestao_aluguel

\echo '=== Histórico Flyway (installed_rank, version, description, success) ==='
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;

\echo ''
\echo '=== Versões aplicadas (distinct) ==='
SELECT version, description, success
FROM flyway_schema_history
ORDER BY version::int NULLS LAST;

\echo ''
\echo '=== Checagem: versões esperadas (1, 3, 4, 5, 6) ==='
WITH expected AS (
    SELECT unnest(ARRAY['1', '3', '4', '5', '6']) AS version
),
applied AS (
    SELECT DISTINCT version FROM flyway_schema_history WHERE success = true
)
SELECT e.version AS expected_version,
       CASE WHEN a.version IS NOT NULL THEN 'OK' ELSE 'FALTANDO' END AS status
FROM expected e
LEFT JOIN applied a ON e.version = a.version
ORDER BY e.version::int;

\echo ''
\echo '=== Checagem: gaps na sequência numérica ==='
WITH versions AS (
    SELECT DISTINCT version::int AS v
    FROM flyway_schema_history
    WHERE success = true AND version ~ '^\d+$'
),
ordered AS (
    SELECT v, LAG(v) OVER (ORDER BY v) AS prev_v FROM versions
)
SELECT prev_v AS from_version, v AS to_version, v - prev_v AS gap
FROM ordered
WHERE prev_v IS NOT NULL AND v - prev_v > 1;

\echo ''
\echo '=== Checagem: migrations com falha ==='
SELECT installed_rank, version, description, success
FROM flyway_schema_history
WHERE success = false;

\echo ''
\echo '=== Checagem: tabela contrato_documento (V6) ==='
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contrato_documento'
) AS contrato_documento_exists;

\echo ''
\echo '=== Nota para bancos existentes (pré-limpeza) ==='
\echo 'Se flyway_schema_history contém version=2 com description create_usuario_table:'
\echo '  DELETE FROM flyway_schema_history WHERE version = ''2'' AND description = ''create usuario table'';'
\echo 'Se version=2 com description add contrato documento (antes da renumeração):'
\echo '  UPDATE flyway_schema_history SET version = ''6'' WHERE version = ''2'' AND description = ''add contrato documento'';'
