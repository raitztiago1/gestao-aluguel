-- Migration V2: adiciona tabela para armazenar PDF do contrato
CREATE TABLE contrato_documento (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contrato(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    conteudo BYTEA NOT NULL,
    tamanho INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contrato_documento_contrato ON contrato_documento(contrato_id);
