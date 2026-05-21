-- Migration para criar a tabela de usuários para autenticação

-- =====================================================
-- TABELA: usuario (Autenticação)
-- =====================================================
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(200) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    token_reset_senha VARCHAR(255),
    expiracao_token_reset TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para acesso rápido por email
CREATE INDEX idx_usuario_email ON usuario(email);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_usuario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuario_updated_at
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION update_usuario_updated_at();
