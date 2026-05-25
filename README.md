# Gestão de Aluguel

Sistema especializado para gestão imobiliária de holdings, focado no controle de locações comerciais e residenciais, automação financeira e gestão de contratos com garantias contratuais.

## 🚀 Arquitetura do Sistema

O projeto utiliza uma arquitetura **Decoupled Full-Stack**:

- **Backend**: API RESTful robusta construída com Spring Boot, utilizando segurança baseada em Tokens JWT e persistência com JPA/Hibernate.
- **Frontend**: SPA (Single Page Application) performática com Next.js, utilizando Server-Side Rendering (SSR) e Client-Side Navigation.
- **Database**: PostgreSQL com lógica de negócio embarcada via Triggers e Procedures para garantir integridade atômica.

---

## ⚙️ Tecnologias Principais

### Backend (Java)

| Tecnologia          | Versão | Finalidade                             |
| :------------------ | :----- | :------------------------------------- |
| **Java**            | 25     | Linguagem base                         |
| **Spring Boot**     | 4.0.4  | Framework principal                    |
| **Spring Security** | 6.x    | Autenticação e Autorização JWT         |
| **Flyway**          | 10.x   | Versionamento de banco de dados        |
| **PostgreSQL**      | 15+    | Banco de dados relacional              |
| **Lombok**          | -      | Produtividade e redução de boilerplate |

### Frontend (Next.js)

| Tecnologia     | Versão | Finalidade                     |
| :------------- | :----- | :----------------------------- |
| **Next.js**    | 14.2.5 | Framework React com App Router |
| **TypeScript** | 5.5.2  | Tipagem estática               |
| **React**      | 18.3.1 | Biblioteca de interface        |
| **Fetch API**  | Native | Comunicação com o backend      |

---

## 📊 Modelo de Dados e Regras de Negócio (DB)

A inteligência de dados está centralizada no esquema SQL (`V1__init.sql`), garantindo que as regras de negócio sejam respeitadas independentemente da interface.

### 1. Entidades Principais

- **Configuração Locador**: Registro único (Singleton via CHECK constraint `id=1`) que armazena os dados da holding/proprietário.
- **Terreno**: Classificado entre `COMERCIAL` ou `RESIDENCIAL`. Possui validação rígida de campos (ex: terrenos residenciais não podem ter "quantidade de salas").
- **Sala**: Unidade locável vinculada a um terreno.
- **Locatário**: Suporte a Pessoa Física (PF) e Pessoa Jurídica (PJ) com campos obrigatórios distintos via restrição de banco.
- **Contrato**: O coração do sistema. Implementa a **Regra de Garantia XOR**: exige obrigatoriamente um Fiador OU um Depósito Caução, nunca ambos ou nenhum.

### 2. Automação Financeira

- **Trigger `trigger_gerar_cobrancas`**: Ao inserir um novo contrato, o sistema gera automaticamente todas as parcelas (cobranças) para o período total da locação.
- **Trigger `trigger_atualizar_inadimplencia`**: Atualiza automaticamente o status da cobrança para `INADIMPLENTE` caso o vencimento ultrapasse a data atual sem registro de pagamento.

### 3. Views de Relatório

- `vw_vencimentos_dia`: Lista cobranças vencendo hoje ou já vencidas e pendentes.
- `vw_relatorio_mensal`: Consolidado de valores previstos, recebidos e inadimplência por mês/ano.

---

## 🔐 Segurança e Autenticação

- **JWT (JSON Web Token)**: Implementado no `JwtFilter.java`. O token tem validade de 24 horas.
- **BCrypt**: Senhas são criptografadas antes de serem persistidas.
- **Proteção de Rotas**: O frontend verifica a validade da sessão (`isSessionValid`) em cada carregamento de página protegida.
- **Global Exception Handler**: Centraliza erros de integridade (ex: tentativa de excluir registro com vínculo) e retorna mensagens amigáveis ao usuário final.

---

## 📁 Estrutura de Arquivos

### Backend

```text
src/main/java/com/felicioecavalaro/gestao_aluguel/
├── controller/      # Endpoints REST e GlobalExceptionHandler
├── domain/          # Entidades JPA e Enums
├── dto/             # Objetos de transferência de dados (Request/Response)
├── exception/       # Exceções personalizadas
├── repository/      # Interfaces Spring Data JPA
├── security/        # Configuração Spring Security e Filtro JWT
└── service/         # Regras de negócio e lógica de serviço
```

### Frontend

```text
frontend/app/
├── components/      # Componentes reutilizáveis (Alertas, Badges, Modais)
├── contratos/       # Gestão de contratos (CRUD e Regras)
├── home/            # Painel de indicadores e Dashboard
├── lib/             # API helpers, máscaras, formatação e gestão de sessão
└── login/           # Interface de autenticação
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos

- JDK 25
- Node.js 18+
- PostgreSQL 15+

### Passo 1: Banco de Dados

Crie um banco chamado `gestao_aluguel`. As tabelas serão criadas automaticamente pelo Flyway no primeiro boot do backend.

### Passo 2: Backend

```bash
# Configurar application.properties com suas credenciais DB
./mvnw clean spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

### Passo 3: Frontend

```bash
cd frontend
npm install
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

---

## 💡 Fluxos Principais

1.  **Cadastro de Imóvel**: Cadastre um Terreno → Adicione Salas a este Terreno.
2.  **Locação**: Cadastre um Locatário → Vincule um Fiador ou Caução → Crie o Contrato.
3.  **Financeiro**: O sistema gera as cobranças. No `Home`, o dashboard destaca os contratos em atraso e o status de ocupação das salas.
4.  **Tratamento de Erros**: Se uma regra de banco for violada (ex: `garantia_xor`), o `GlobalExceptionHandler` intercepta e o frontend exibe um alerta detalhado via `ErrorAlert`.

---

## 📝 Notas de Versão

- **V1.0.0**: Migração inicial, CRUDs básicos, triggers de cobrança automática e autenticação JWT funcional.
