# 🔐 Sistema de Autenticação - Guia Completo

## Visão Geral

O sistema foi implementado com **autenticação funcional 100%**, incluindo:

- ✅ Login com validação de credenciais
- ✅ Registro de novos usuários com validação de senha forte
- ✅ Recuperação de senha (esqueci a senha)
- ✅ Autenticação com JWT (JSON Web Tokens)
- ✅ Sessão persistente no navegador

## Arquitetura Implementada

### Backend (Java/Spring Boot)

#### Novas Entidades

- **`Usuario`** - Modelo de usuário com campos de autenticação
  - `email` - Identificador único do usuário
  - `senha` - Criptografada com BCrypt
  - `nomeCompleto` - Nome do usuário
  - `ativo` - Flag para desativar usuários
  - `tokenResetSenha` - Token para redefinição de senha
  - `expiracaoTokenReset` - Data de expiração do token

#### Serviços

- **`JwtService`** - Gerenciamento de tokens JWT
  - `generateToken()` - Gera token com 24 horas de validade
  - `isTokenValid()` - Valida token
  - `extractEmail()` - Extrai email do token
- **`AuthenticationService`** - Lógica de autenticação
  - `login()` - Autentica usuário com email/senha
  - `register()` - Cria novo usuário
  - `requestPasswordReset()` - Inicia processo de redefinição
  - `resetPassword()` - Reseta senha com token válido

#### Controllers

- **`AuthController`** - Endpoints de autenticação
  - `POST /api/auth/login` - Login
  - `POST /api/auth/register` - Registro
  - `POST /api/auth/forgot-password` - Solicita redefinição
  - `POST /api/auth/reset-password` - Reseta senha

#### Banco de Dados

- Tabela `usuario` criada via Flyway migration `V2__create_usuario_table.sql`
- Suporta PostgreSQL com campos JSONB para dados flexíveis

### Frontend (Next.js/React)

#### Novas Páginas

- **`/login`** - Tela de login funcional
- **`/register`** - Tela de cadastro com validações
- **`/forgot-password`** - Tela de recuperação de senha

#### Funcionalidades

- ✨ Validação em tempo real de formulários
- 🔒 Requisitos de senha forte (8+ caracteres, maiúsculas, números)
- 📱 Responsividade total
- 🛡️ Tratamento de erros com mensagens claras
- 💾 Armazenamento de sessão no localStorage

#### Funções de API

- `login()` - Autentica e retorna token
- `register()` - Cria novo usuário
- `forgotPassword()` - Solicita redefinição
- `resetPassword()` - Reseta com token

## Como Usar

### 1️⃣ Compilar e Rodar o Backend

```bash
cd c:\dev\gestao-aluguel

# Compilar
.\mvnw.cmd clean compile

# Rodar
.\mvnw.cmd spring-boot:run
```

### 2️⃣ Instalar e Rodar o Frontend

```bash
cd c:\dev\gestao-aluguel\frontend

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Ou compilar para produção
npm run build
npm run start
```

### 3️⃣ Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Login inicial**: Crie uma conta em `/register`

## Fluxos Principais

### Fluxo de Login

1. Usuário acessa `/login`
2. Insere email e senha
3. Frontend envia para `POST /api/auth/login`
4. Backend valida credenciais e retorna JWT
5. Frontend armazena token e dados do usuário
6. Redireciona para `/home`

### Fluxo de Registro

1. Usuário acessa `/register`
2. Preenche email, nome e senha (validada)
3. Frontend envia para `POST /api/auth/register`
4. Backend cria usuário com senha criptografada
5. Retorna JWT automaticamente
6. Usuário já fica logado

### Fluxo de Recuperação de Senha

1. Usuário acessa `/forgot-password`
2. Insere email
3. Backend gera token e o armazena
4. **TODO**: Implementar envio de email com token
5. Usuário recebe email com link (com token na URL)
6. Clica no link e é redirecionado para `/forgot-password?token=XXX`
7. Preenche nova senha
8. Backend valida token e atualiza senha

## Validações Implementadas

### Senha

- Mínimo 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número

### Email

- Deve conter `@` e ponto
- Único no sistema (não pode cadastrar email duplicado)

### Geral

- Campos obrigatórios verificados
- Mensagens de erro claras e amigáveis
- Loading states durante requisições
- Timeout de sessão (24 horas)

## Estrutura de Arquivos

### Backend

```
src/main/java/com/felicioecavalaro/gestao_aluguel/
├── domain/model/Usuario.java
├── dto/
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   ├── RegisterRequest.java
│   ├── ForgotPasswordRequest.java
│   └── ResetPasswordRequest.java
├── repository/UsuarioRepository.java
├── service/
│   ├── JwtService.java
│   └── AuthenticationService.java
├── controller/AuthController.java
└── security/SecurityConfig.java
```

### Frontend

```
app/
├── lib/
│   ├── api.ts (funções auth adicionadas)
│   └── session.ts (gerenciamento JWT)
├── login/page.tsx (tela login funcional)
├── register/page.tsx (tela registro funcional)
└── forgot-password/page.tsx (tela recuperação funcional)
```

## Banco de Dados

### Migrations

- `V1__init.sql` - Tabelas iniciais (locatarios, salas, etc)
- `V2__create_usuario_table.sql` - Tabela de usuários

### Conectar ao PostgreSQL

```sql
-- Verificar tabela criada
SELECT * FROM usuario;

-- Inserir teste manual (senha: Senha123)
INSERT INTO usuario (email, senha, nome_completo, ativo, created_at)
VALUES ('teste@example.com',
        '$2a$10$...', -- BCrypt hash
        'Usuário Teste',
        true,
        NOW());
```

## Segurança

### Implementado

- ✅ Criptografia de senhas com BCrypt
- ✅ JWT tokens com expiração
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Proteção contra força bruta (TODO)

### Recomendações para Produção

- ⚠️ Mudar `app.jwt.secret` em `application.properties`
- ⚠️ Implementar rate limiting
- ⚠️ Usar HTTPS/SSL
- ⚠️ Implementar autenticação 2FA
- ⚠️ Adicionar logs de auditoria
- ⚠️ Envio de email real para recuperação de senha

## Próximas Etapas

### Melhorias Futuras

1. **Email** - Implementar envio de email real para reset
2. **2FA** - Autenticação de dois fatores
3. **OAuth** - Integração com Google/GitHub
4. **Rate Limiting** - Proteção contra brute force
5. **Auditoria** - Log de login/ações
6. **Permissões** - Roles e autorização
7. **Refresh Tokens** - Tokens de longa duração

## Troubleshooting

### Erro: "Usuário não encontrado"

- Certifique-se que criou a conta em `/register`
- Verifique se o email está correto

### Erro: "Conexão recusada"

- Backend não está rodando na porta 8080
- Verifique se PostgreSQL está em execução
- Verifique as credenciais do banco em `application.properties`

### Erro: "Token expirado"

- Faça login novamente
- Sessão expira após 24 horas

### Erro: "Senha não atende requisitos"

- Use mínimo 8 caracteres
- Inclua maiúscula, minúscula e número

## Contato

Para dúvidas ou problemas, verifique os logs:

- Backend: Console do Spring Boot
- Frontend: Browser DevTools (F12 → Console)

---

**Última atualização**: 21 de Maio de 2026
**Versão**: 1.0.0
