# Testes de Segurança — Referência

## Visão geral

A suite de testes de segurança cobre vulnerabilidades comuns (OWASP Top 10), com ênfase em:

- Injeção de dados (SQL injection, XSS, command injection)
- Validação de entrada (emails, senhas, valores numéricos)
- Rate limiting (proteção contra brute force)
- Autenticação e tokens JWT
- Autorização e controle de acesso
- Headers HTTP de segurança
- Proteção contra CSRF e session hijacking

**Fonte de verdade:** execute `.\mvnw.cmd test` (ou o pipeline de CI) para verificar o estado atual da suite. Este documento descreve categorias e classes de teste — não fixa contagens que podem ficar desatualizadas.

---

## Classes de teste de segurança

### InputSanitizerSecurityTest

Valida proteção contra injeção de dados maliciosos:

- SQL Injection em email
- XSS (Cross-Site Scripting) em email
- Command injection em email
- Rejeição de formatos de email inválidos
- XSS em nome de usuário
- SQL injection em nome
- Rejeição de caracteres especiais perigosos
- Validação de comprimento de nome
- Aceitação de nomes válidos com caracteres especiais (José)

### PasswordValidatorSecurityTest

Valida força de senhas e requisitos de segurança:

- Rejeição de senhas muito curtas
- Rejeição sem letra maiúscula, minúscula ou números
- Aceitação de senhas com todos os requisitos
- Rejeição de null e string vazia

### RateLimiterSecurityTest

Protege contra brute force:

- Permite tentativas iniciais de login
- Bloqueia conta após tentativas falhas (configurável)
- Reseta contador ao login com sucesso
- Contadores independentes por usuário

### JwtSecurityTest

Valida geração e validação de tokens JWT:

- Gera token válido com três partes (header.payload.signature)
- Rejeita token inválido ou modificado
- Extrai informações do usuário do token

### SecurityExceptionTest

Valida tratamento de exceções de segurança (autenticação, acesso negado, recurso não encontrado).

### InputValidationSecurityTest

Valida campos obrigatórios em DTOs de login e registro.

### AuthorizationSecurityTest

Valida autenticação, autorização, IDOR, CORS e CSRF.

### DataInjectionSecurityTest

Valida injeção de dados maliciosos em DTOs (SQL, XSS, valores numéricos inválidos).

### HTTPSecurityHeadersTest

Valida headers HTTP de segurança (CSRF, CSP, X-Frame-Options, HSTS, CORS).

### SessionSecurityTest

Valida segurança de sessão (fixation, timeout, cookies seguros).

### SecurityFilterChainIntegrationTest

Testes de integração MockMvc da cadeia de filtros Spring Security (pós-hardening).

---

## Vulnerabilidades cobertas (OWASP Top 10)

1. SQL Injection — InputSanitizer, DataInjectionSecurityTest
2. XSS — InputSanitizer, DataInjectionSecurityTest
3. Command Injection — InputSanitizer
4. Broken Authentication — JwtSecurityTest, AuthorizationSecurityTest
5. Broken Authorization — AuthorizationSecurityTest, RateLimiterSecurityTest
6. Insecure Deserialization — InputValidationSecurityTest
7. Sensitive Data Exposure — JwtSecurityTest, SessionSecurityTest
8. CSRF — HTTPSecurityHeadersTest, SecurityFilterChainIntegrationTest

---

## Componentes de segurança testados

- **InputSanitizer** — sanitização de email e nome
- **PasswordValidator** — força de senha
- **RateLimiter** — lockout após tentativas falhas
- **JwtService** — JWT com HS512
- **SecurityConfig** — CORS, CSRF, rate limit
- **JwtFilter** — validação de token em requisições
- **AuthenticationService** — login, registro, reset de senha

---

## Verificação

```powershell
# Suite completa (inclui testes de segurança)
.\mvnw.cmd test

# Apenas pacote de segurança
.\mvnw.cmd "-Dtest=*SecurityTest" test
```

Skill local de referência: `.cursor/skills/backend-security-hardening/`

---

_Documento atualizado na limpeza de repositório (2026-07-30). Contagens históricas removidas — use CI/`mvnw test` como fonte dinâmica._
