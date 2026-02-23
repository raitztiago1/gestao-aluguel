-- =====================================================
-- DATABASE: gestao_aluguel
-- =====================================================

-- Criação do banco (execute apenas se necessário)
-- CREATE DATABASE gestao_aluguel;

-- =====================================================
-- ENUMS (Tipos personalizados)
-- =====================================================

CREATE TYPE tipo_terreno AS ENUM ('COMERCIAL', 'RESIDENCIAL');
CREATE TYPE tipo_pessoa AS ENUM ('FISICA', 'JURIDICA');
CREATE TYPE status_sala AS ENUM ('DISPONIVEL', 'LOCADA', 'MANUTENCAO');
CREATE TYPE status_contrato AS ENUM ('ATIVO', 'ENCERRADO', 'RENOVADO');
CREATE TYPE status_cobranca AS ENUM ('PENDENTE', 'PAGO', 'INADIMPLENTE', 'CANCELADO');
CREATE TYPE tipo_garantia AS ENUM ('FIADOR', 'CAUCAO');
CREATE TYPE status_caucao AS ENUM ('ATIVA', 'UTILIZADA', 'DEVOLVIDA');

-- =====================================================
-- TABELA: configuracao_locador (Regra 3.1 - Locador único)
-- =====================================================
CREATE TABLE configuracao_locador (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(20),
    endereco TEXT NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10),
    telefone VARCHAR(20),
    email VARCHAR(100),
    dados_bancarios JSONB, -- Armazena banco, agência, conta em formato flexível
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantia de que só haverá UM registro (regra 3.1)
    CONSTRAINT unico_locador CHECK (id = 1)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracao_locador_updated_at
    BEFORE UPDATE ON configuracao_locador
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: terreno (Regras 1.1 e 1.2)
-- =====================================================
CREATE TABLE terreno (
    id SERIAL PRIMARY KEY,
    tipo tipo_terreno NOT NULL,
    endereco TEXT NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10),
    metragem_total DECIMAL(10,2) NOT NULL,
    
    -- Campos específicos para COMERCIAL
    vagas_garagem INTEGER,
    quantidade_salas INTEGER,
    metragem_salas DECIMAL(10,2), -- Metragem individual das salas
    
    -- Campos específicos para RESIDENCIAL
    metragem_casa DECIMAL(10,2),
    
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validação: campos obrigatórios conforme tipo
    CONSTRAINT valida_terreno_comercial CHECK (
        (tipo = 'COMERCIAL' AND 
         vagas_garagem IS NOT NULL AND 
         quantidade_salas IS NOT NULL AND 
         metragem_salas IS NOT NULL AND
         metragem_casa IS NULL)
        OR
        (tipo = 'RESIDENCIAL' AND 
         metragem_casa IS NOT NULL AND
         vagas_garagem IS NULL AND 
         quantidade_salas IS NULL AND 
         metragem_salas IS NULL)
    )
);

CREATE TRIGGER update_terreno_updated_at
    BEFORE UPDATE ON terreno
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: sala (Regra 2)
-- =====================================================
CREATE TABLE sala (
    id SERIAL PRIMARY KEY,
    terreno_id INTEGER NOT NULL REFERENCES terreno(id) ON DELETE RESTRICT,
    identificacao VARCHAR(50) NOT NULL, -- Ex: "Sala 101", "Loja A", "Casa"
    metragem DECIMAL(10,2) NOT NULL,
    status status_sala DEFAULT 'DISPONIVEL',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Uma sala pertence a um único terreno e identificação única por terreno
    CONSTRAINT unique_sala_por_terreno UNIQUE (terreno_id, identificacao)
);

CREATE TRIGGER update_sala_updated_at
    BEFORE UPDATE ON sala
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: locatario (Regra 3.2)
-- =====================================================
CREATE TABLE locatario (
    id SERIAL PRIMARY KEY,
    tipo_pessoa tipo_pessoa NOT NULL,
    nome VARCHAR(200) NOT NULL, -- Razão social ou nome completo
    cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    celular VARCHAR(20),
    endereco TEXT NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10),
    
    -- Campos para Pessoa Física
    identidade VARCHAR(20),
    orgao_expeditor VARCHAR(10),
    data_nascimento DATE,
    estado_civil VARCHAR(20),
    profissao VARCHAR(100),
    renda_mensal DECIMAL(10,2),
    
    -- Campos para Pessoa Jurídica
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    contato_responsavel VARCHAR(200),
    cargo_contato VARCHAR(100),
    
    -- Documentos (URLs armazenadas como JSON)
    documentos JSONB,
    
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validação: campos obrigatórios conforme tipo
    CONSTRAINT valida_locatario CHECK (
        (tipo_pessoa = 'FISICA' AND 
         identidade IS NOT NULL AND 
         data_nascimento IS NOT NULL)
        OR
        (tipo_pessoa = 'JURIDICA' AND 
         inscricao_estadual IS NOT NULL AND 
         contato_responsavel IS NOT NULL)
    )
);

CREATE TRIGGER update_locatario_updated_at
    BEFORE UPDATE ON locatario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: fiador (Regra 4)
-- =====================================================
CREATE TABLE fiador (
    id SERIAL PRIMARY KEY,
    locatario_id INTEGER NOT NULL REFERENCES locatario(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    identidade VARCHAR(20) NOT NULL,
    orgao_expeditor VARCHAR(10),
    data_nascimento DATE NOT NULL,
    nacionalidade VARCHAR(50) DEFAULT 'Brasileiro',
    estado_civil VARCHAR(20),
    profissao VARCHAR(100),
    renda_mensal DECIMAL(10,2) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10),
    
    -- Documentos (URLs)
    documentos JSONB,
    
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_fiador_updated_at
    BEFORE UPDATE ON fiador
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: caucao (Regra 4)
-- =====================================================
CREATE TABLE caucao (
    id SERIAL PRIMARY KEY,
    locatario_id INTEGER NOT NULL REFERENCES locatario(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'DINHEIRO', 'IMOVEL', 'TITULOS', etc
    descricao TEXT,
    data_deposito DATE NOT NULL,
    data_previsao_devolucao DATE,
    data_devolucao DATE,
    status status_caucao DEFAULT 'ATIVA',
    comprovante_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valor_positivo CHECK (valor > 0)
);

CREATE TRIGGER update_caucao_updated_at
    BEFORE UPDATE ON caucao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: contrato (Regras 4 e 5)
-- =====================================================
CREATE TABLE contrato (
    id SERIAL PRIMARY KEY,
    sala_id INTEGER NOT NULL REFERENCES sala(id) ON DELETE RESTRICT,
    locatario_id INTEGER NOT NULL REFERENCES locatario(id) ON DELETE RESTRICT,
    
    -- Garantia (XOR - uma delas obrigatória)
    fiador_id INTEGER REFERENCES fiador(id) ON DELETE RESTRICT,
    caucao_id INTEGER REFERENCES caucao(id) ON DELETE RESTRICT,
    
    -- Datas
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    data_renovacao DATE, -- Data da última renovação
    
    -- Valores
    valor_aluguel DECIMAL(10,2) NOT NULL,
    valor_condominio DECIMAL(10,2) DEFAULT 0,
    valor_iptu DECIMAL(10,2) DEFAULT 0,
    dia_vencimento INTEGER NOT NULL, -- 1 a 31
    
    -- Informações contratuais
    regras_pagamento TEXT,
    observacoes TEXT,
    documento_url TEXT, -- PDF do contrato
    
    -- Status
    status status_contrato DEFAULT 'ATIVO',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- Usuário que criou (futuro)
    
    -- Validações críticas
    CONSTRAINT data_termino_maior CHECK (data_termino > data_inicio),
    CONSTRAINT dia_vencimento_valido CHECK (dia_vencimento BETWEEN 1 AND 31),
    CONSTRAINT valor_positivo CHECK (valor_aluguel > 0),
    
    -- Regra 4: OBRIGATORIAMENTE um fiador OU uma caução (XOR)
    CONSTRAINT garantia_xor CHECK (
        (fiador_id IS NOT NULL AND caucao_id IS NULL) OR
        (fiador_id IS NULL AND caucao_id IS NOT NULL)
    )
);

CREATE TRIGGER update_contrato_updated_at
    BEFORE UPDATE ON contrato
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índice para buscar contratos ativos por sala
CREATE INDEX idx_contrato_sala_status ON contrato(sala_id, status) WHERE status = 'ATIVO';

-- =====================================================
-- TABELA: aditivo (Regra 5.1)
-- =====================================================
CREATE TABLE aditivo (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contrato(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    alteracoes JSONB NOT NULL, -- Armazena o que mudou (ex: {"valor_aluguel": 1500, "dia_vencimento": 10})
    documento_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- =====================================================
-- TABELA: cobranca (Regra 6.1)
-- =====================================================
CREATE TABLE cobranca (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contrato(id) ON DELETE CASCADE,
    
    -- Identificação do período
    mes_referencia INTEGER NOT NULL, -- 1 a 12
    ano_referencia INTEGER NOT NULL,
    data_vencimento DATE NOT NULL,
    
    -- Valores
    valor_aluguel DECIMAL(10,2) NOT NULL,
    valor_condominio DECIMAL(10,2) DEFAULT 0,
    valor_iptu DECIMAL(10,2) DEFAULT 0,
    valor_agua DECIMAL(10,2) DEFAULT 0,
    valor_luz DECIMAL(10,2) DEFAULT 0,
    valor_multa DECIMAL(10,2) DEFAULT 0,
    valor_juros DECIMAL(10,2) DEFAULT 0,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    valor_pago DECIMAL(10,2), -- Preenchido quando pago (pode ser diferente do total)
    valor_total DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(valor_aluguel, 0) + 
        COALESCE(valor_condominio, 0) + 
        COALESCE(valor_iptu, 0) + 
        COALESCE(valor_agua, 0) + 
        COALESCE(valor_luz, 0) + 
        COALESCE(valor_multa, 0) + 
        COALESCE(valor_juros, 0) - 
        COALESCE(valor_desconto, 0)
    ) STORED,
    
    -- Controle de pagamento
    status status_cobranca DEFAULT 'PENDENTE',
    data_pagamento DATE,
    forma_pagamento VARCHAR(50), -- 'DINHEIRO', 'PIX', 'BOLETO', 'TRANSFERENCIA'
    comprovante_url TEXT,
    observacoes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantir uma cobrança por mês por contrato
    CONSTRAINT unique_cobranca_mes UNIQUE (contrato_id, mes_referencia, ano_referencia),
    CONSTRAINT mes_valido CHECK (mes_referencia BETWEEN 1 AND 12),
    CONSTRAINT ano_valido CHECK (ano_referencia >= 2000)
);

CREATE TRIGGER update_cobranca_updated_at
    BEFORE UPDATE ON cobranca
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para buscas financeiras
CREATE INDEX idx_cobranca_vencimento ON cobranca(data_vencimento) WHERE status = 'PENDENTE';
CREATE INDEX idx_cobranca_status ON cobranca(status, mes_referencia, ano_referencia);

-- =====================================================
-- VIEW: vw_vencimentos_dia (Regra 6.2)
-- =====================================================
CREATE VIEW vw_vencimentos_dia AS
SELECT 
    c.id AS cobranca_id,
    loc.nome AS locatario_nome,
    loc.cpf_cnpj AS locatario_documento,
    s.identificacao AS sala_identificacao,
    t.endereco || ', ' || t.numero AS terreno_endereco,
    c.valor_total,
    c.status,
    c.data_vencimento,
    cont.id AS contrato_id,
    CASE 
        WHEN c.data_vencimento < CURRENT_DATE AND c.status = 'PENDENTE' THEN 'INADIMPLENTE'
        ELSE c.status::TEXT
    END AS situacao_atual
FROM cobranca c
JOIN contrato cont ON c.contrato_id = cont.id
JOIN locatario loc ON cont.locatario_id = loc.id
JOIN sala s ON cont.sala_id = s.id
JOIN terreno t ON s.terreno_id = t.id
WHERE c.data_vencimento = CURRENT_DATE
   OR (c.data_vencimento < CURRENT_DATE AND c.status = 'PENDENTE');

-- =====================================================
-- VIEW: vw_relatorio_mensal (Regra 7)
-- =====================================================
CREATE VIEW vw_relatorio_mensal AS
SELECT 
    c.ano_referencia,
    c.mes_referencia,
    t.id AS terreno_id,
    t.endereco AS terreno_endereco,
    t.tipo AS terreno_tipo,
    s.id AS sala_id,
    s.identificacao AS sala_identificacao,
    loc.id AS locatario_id,
    loc.nome AS locatario_nome,
    loc.cpf_cnpj AS locatario_documento,
    cont.id AS contrato_id,
    c.valor_total AS valor_previsto,
    c.valor_pago,
    c.status,
    c.data_pagamento,
    CASE 
        WHEN c.status = 'PAGO' THEN c.valor_pago
        ELSE 0
    END AS valor_recebido,
    CASE 
        WHEN c.status = 'PENDENTE' AND c.data_vencimento < CURRENT_DATE THEN c.valor_total
        ELSE 0
    END AS valor_inadimplente
FROM cobranca c
JOIN contrato cont ON c.contrato_id = cont.id
JOIN sala s ON cont.sala_id = s.id
JOIN terreno t ON s.terreno_id = t.id
JOIN locatario loc ON cont.locatario_id = loc.id;

-- =====================================================
-- FUNCTIONS e TRIGGERS automáticos
-- =====================================================

-- Função para gerar cobranças automaticamente ao criar contrato
CREATE OR REPLACE FUNCTION gerar_cobrancas_contrato()
RETURNS TRIGGER AS $$
DECLARE
    mes_atual DATE;
    data_venc DATE;
    i INTEGER;
BEGIN
    mes_atual := NEW.data_inicio;
    
    -- Gera cobranças mês a mês até a data de término
    WHILE mes_atual <= NEW.data_termino LOOP
        -- Calcula data de vencimento (dia definido no contrato)
        data_venc := DATE_TRUNC('month', mes_atual) + (NEW.dia_vencimento - 1) * INTERVAL '1 day';
        
        -- Ajusta se dia de vencimento não existir no mês
        IF EXTRACT(DAY FROM data_venc) != NEW.dia_vencimento THEN
            data_venc := DATE_TRUNC('month', mes_atual) + INTERVAL '1 month' - INTERVAL '1 day';
        END IF;
        
        INSERT INTO cobranca (
            contrato_id,
            mes_referencia,
            ano_referencia,
            data_vencimento,
            valor_aluguel,
            valor_condominio,
            valor_iptu
        ) VALUES (
            NEW.id,
            EXTRACT(MONTH FROM mes_atual),
            EXTRACT(YEAR FROM mes_atual),
            data_venc,
            NEW.valor_aluguel,
            NEW.valor_condominio,
            NEW.valor_iptu
        );
        
        mes_atual := mes_atual + INTERVAL '1 month';
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_cobrancas
    AFTER INSERT ON contrato
    FOR EACH ROW
    EXECUTE FUNCTION gerar_cobrancas_contrato();

-- Função para atualizar status de inadimplência automaticamente
CREATE OR REPLACE FUNCTION atualizar_inadimplencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Se passou do vencimento e ainda está pendente, marca como inadimplente
    IF NEW.data_vencimento < CURRENT_DATE AND NEW.status = 'PENDENTE' THEN
        NEW.status := 'INADIMPLENTE';
    END IF;
    
    -- Se foi pago, registra data se não foi informada
    IF NEW.status = 'PAGO' AND NEW.data_pagamento IS NULL THEN
        NEW.data_pagamento := CURRENT_DATE;
    END IF;
    
    -- Se valor pago não foi informado, usa o valor total
    IF NEW.status = 'PAGO' AND NEW.valor_pago IS NULL THEN
        NEW.valor_pago := NEW.valor_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_inadimplencia
    BEFORE INSERT OR UPDATE ON cobranca
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_inadimplencia();

-- =====================================================
-- Índices adicionais para performance
-- =====================================================

CREATE INDEX idx_locatario_cpf_cnpj ON locatario(cpf_cnpj);
CREATE INDEX idx_contrato_locatario ON contrato(locatario_id);
CREATE INDEX idx_contrato_datas ON contrato(data_inicio, data_termino);
CREATE INDEX idx_cobranca_periodo ON cobranca(ano_referencia, mes_referencia);
CREATE INDEX idx_aditivo_contrato ON aditivo(contrato_id, data);

-- =====================================================
-- Comentários nas tabelas e colunas
-- =====================================================

COMMENT ON TABLE configuracao_locador IS 'Configuração do locador único (Holding) - Regra 3.1';
COMMENT ON TABLE terreno IS 'Terrenos comerciais ou residenciais - Regras 1.1 e 1.2';
COMMENT ON TABLE sala IS 'Salas vinculadas a terrenos - Regra 2';
COMMENT ON TABLE locatario IS 'Locatários PF ou PJ - Regra 3.2';
COMMENT ON TABLE fiador IS 'Fiadores vinculados a locatários - Regra 4';
COMMENT ON TABLE caucao IS 'Cauções vinculadas a locatários - Regra 4';
COMMENT ON TABLE contrato IS 'Contratos de locação com garantias - Regras 4 e 5';
COMMENT ON TABLE aditivo IS 'Aditivos contratuais - Regra 5.1';
COMMENT ON TABLE cobranca IS 'Controle mensal de pagamentos - Regra 6.1';
COMMENT ON COLUMN contrato.garantia_xor IS 'Garantia obrigatória: fiador OU caução';