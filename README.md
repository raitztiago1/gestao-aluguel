# Gestão de Aluguel

Projeto full-stack para gestão de aluguéis de uma holding imobiliária. O sistema permite controlar terrenos comerciais e residenciais, salas comerciais, locatários, contratos, garantias (fiador/caução), além de oferecer recursos de autenticação e gestão financeira.

## Visão geral

A aplicação é composta por duas camadas principais:

- Backend Java com Spring Boot para lógica de negócio, persistência, segurança e versionamento de banco de dados.
- Frontend React/Next.js para interface de usuário moderna, com rotas e formulários.

## Stack e tecnologias

### Backend

- Java 25
- Spring Boot 4.0.4
- Spring Data JPA
- Spring Security
- Spring Validation
- Spring WebMVC
- PostgreSQL (driver `org.postgresql:postgresql`)
- Flyway para migrações de banco de dados
- JWT (`io.jsonwebtoken`) para autenticação/autorizações
- Jackson JSR-310 para serialização de data/hora
- Lombok para reduzir boilerplate
- Dependências de teste do Spring Boot

### Frontend

- Next.js 14.2.5
- React 18.3.1
- TypeScript 5.5.2
- ESLint com `eslint-config-next`

## Estrutura do projeto

- `pom.xml` — dependências e configuração Maven do backend
- `src/main/java` — código-fonte Java do serviço backend
- `src/main/resources` — propriedades de aplicação, scripts Flyway e recursos estáticos
- `frontend/` — aplicação Next.js do frontend
- `frontend/app/` — páginas e componentes React
- `frontend/lib/` — utilitários de API, formatação, máscaras e sessão

## Como executar

### Backend

1. Configure um banco PostgreSQL.
2. Ajuste a conexão no arquivo `src/main/resources/application.properties`.
3. Execute o backend com Maven:

```bash
./mvnw spring-boot:run
```

### Frontend

Acesse a pasta `frontend` e execute:

```bash
cd frontend
npm install
npm run dev
```

Em seguida, abra o endereço fornecido pelo servidor Next.js.

## Observações

- O backend utiliza Flyway para gerenciar a versão do esquema do banco de dados em `src/main/resources/db/migration/V1__init.sql`.
- A interface do frontend está organizada com rotas como `login`, `register`, `home`, `contratos`, `locatarios`, `salas` e `terrenos`.
- A aplicação foi projetada para oferecer um controle completo de imóveis, contratos e locatários em um ambiente corporativo imobiliário.
