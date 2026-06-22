CREATE TABLE cobranca (
    id BIGSERIAL PRIMARY KEY,
    contrato_id BIGINT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    data_pagamento DATE,
    observacoes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by BIGINT,
    CONSTRAINT fk_cobranca_contrato FOREIGN KEY (contrato_id) REFERENCES contrato (id),
    CONSTRAINT cobranca_unico_por_mes UNIQUE (contrato_id, ano, mes),
    CONSTRAINT cobranca_mes_valido CHECK (mes BETWEEN 1 AND 12)
);
