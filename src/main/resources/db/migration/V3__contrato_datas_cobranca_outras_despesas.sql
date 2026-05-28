ALTER TABLE contrato
    ADD COLUMN dia_vencimento_agua INTEGER,
    ADD COLUMN dia_vencimento_luz INTEGER,
    ADD COLUMN dia_vencimento_iptu INTEGER,
    ADD COLUMN valor_outras_despesas DECIMAL(10,2) DEFAULT 0;

ALTER TABLE contrato
    ADD CONSTRAINT dia_vencimento_agua_valido CHECK (dia_vencimento_agua BETWEEN 1 AND 31 OR dia_vencimento_agua IS NULL),
    ADD CONSTRAINT dia_vencimento_luz_valido CHECK (dia_vencimento_luz BETWEEN 1 AND 31 OR dia_vencimento_luz IS NULL),
    ADD CONSTRAINT dia_vencimento_iptu_valido CHECK (dia_vencimento_iptu BETWEEN 1 AND 31 OR dia_vencimento_iptu IS NULL),
    ADD CONSTRAINT valor_outras_despesas_nao_negativo CHECK (valor_outras_despesas >= 0);
