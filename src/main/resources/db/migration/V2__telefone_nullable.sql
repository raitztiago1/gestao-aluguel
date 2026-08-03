-- Migration: tornar coluna telefone NULLABLE em locatario e fiador
-- Data: 2026-08-03

ALTER TABLE IF EXISTS locatario ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE IF EXISTS fiador ALTER COLUMN telefone DROP NOT NULL;

