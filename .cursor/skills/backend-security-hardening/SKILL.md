---
name: backend-security-hardening
description: >
  Audita e endurece segurança de APIs Spring Boot JWT (Gestão de Aluguel) sem quebrar SPA Bearer.
  Use quando o usuário pedir melhorar segurança do backend, hardening, audit de SecurityConfig,
  rate limit, upload seguro, segredos via env, testes MockMvc do filter chain, ou validar
  specs/backend-security-hardening. Stack: Java 25, Spring Boot 4, Next.js consumidor.
---

# Backend Security Hardening — Gestão de Aluguel

Endurecimento incremental para API JWT + SPA. **Não reativar CSRF** (quebra Bearer). RBAC/refresh token ficam fora do escopo padrão.

Spec de referência: `specs/backend-security-hardening/about.md`

---

## Quando usar

- Pedido de audit ou melhoria de segurança no backend
- Antes de deploy/produção
- Após adicionar endpoints públicos ou upload de arquivos
- Validar regressão pós-mudança em `SecurityConfig`, auth ou upload

Anunciar: "Estou usando a skill **backend-security-hardening** para [propósito]."

---

## Verificação rápida (sempre executar)

```powershell
# Na raiz do repo
.\.cursor\skills\backend-security-hardening\scripts\verify-security.ps1
```

Ou manualmente:

```powershell
.\mvnw.cmd test
.\mvnw.cmd "-Dtest=SecurityFilterChainIntegrationTest" test
.\mvnw.cmd "-Dtest=AuthenticationServiceTest,ContratoDocumentoServiceTest" test
```

**Gate:** BUILD SUCCESS; 7 cenários em `SecurityFilterChainIntegrationTest` verdes.

---

## Scorecard de audit (0–5)

| Dimensão | Onde olhar | Red flag |
|----------|------------|----------|
| Rotas públicas | `SecurityConfig.java` | `/api/test/**` ou dev-only exposto em prod |
| Registro | `app.auth.registration-enabled` | `true` em prod |
| Segredos | `application.properties` | JWT/DB/SMTP hardcoded; comentários com senha |
| Brute-force | `AuthenticationService`, `RateLimiter` | Só login limitado |
| Headers | `SecurityConfig.headers` | Ausência de nosniff / DENY |
| Upload | `ContratoDocumentoService` | Só Content-Type, sem magic bytes/tamanho |
| Testes reais | `SecurityFilterChainIntegrationTest` | Placeholders que não batem no filter chain |

Meta pós-hardening: **≥4/5** nas dimensões acima.

---

## Padrões implementados neste projeto

### 1. Endpoints de dev isolados

```java
@Profile("dev")
@RestController
@RequestMapping("/api/test")
public class TestController { ... }
```

- `SecurityConfig` **não** usa `permitAll` para `/api/test/**`
- Prod: bean ausente → 404

### 2. Registro público configurável

- Propriedade: `app.auth.registration-enabled` (`false` em `application-prod.properties`)
- Exceção: `RegistrationDisabledException` → 403 JSON `{ "message": "Cadastro público desabilitado." }`

### 3. Segredos via env

| Propriedade | Env var | Prod |
|-------------|---------|------|
| `app.jwt.secret` | `APP_JWT_SECRET` | Obrigatório (≥64 bytes) |
| DB | `SPRING_DATASOURCE_*` | Obrigatório |
| Profile | `SPRING_PROFILES_ACTIVE=prod` | Sem defaults inseguros |

Dev default: `spring.profiles.active=dev` em `application.properties`.

### 4. Rate limit com namespace

- Login: chave = email
- Forgot-password: chave = `forgot:` + email
- Usar overloads de `RateLimiter` com limites por ação
- Não revelar existência de e-mail no reset

### 5. Headers HTTP

Em `SecurityConfig`: `contentTypeOptions`, `frameOptions(DENY)`, `referrerPolicy(NO_REFERRER)`.
HSTS **somente** se `server.ssl.enabled=true`.

### 6. Upload PDF

Em `ContratoDocumentoService.store`:

1. `app.upload.max-file-size` (default 10MB) + `spring.servlet.multipart.max-file-size=10MB`
2. Magic bytes `%PDF-` nos primeiros 5 bytes
3. `sanitizeFilename()` no download (`Content-Disposition`)

### 7. Testes MockMvc (fonte de verdade)

Arquivo: `src/test/java/.../security/SecurityFilterChainIntegrationTest.java`

| Cenário | Esperado |
|---------|----------|
| T1 | GET `/api/contratos` sem token → 401 |
| T2 | Com JWT válido → 200 |
| T3 | POST `/api/auth/login` público |
| T4 | POST `/api/test/*` sem profile dev → 404 ou 401 |
| T5 | Headers nosniff + X-Frame-Options DENY |
| T6 | Register com flag off → 403 |
| T7 | Upload fake PDF → 400 |

Padrão: `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` + `@MockitoBean` para repos/services pesados.

Profile de teste: `src/test/resources/application-test.properties`

---

## Workflow de implementação (ondas)

Ordem segura (não quebra frontend):

```
1. @Profile("dev") + remover permitAll de test
2. Segredos env + application-prod.properties
3. Flag registration + RateLimiter forgot-password
4. Headers SecurityConfig
5. Upload hardening
6. SecurityFilterChainIntegrationTest (+ unit tests)
7. README variáveis de ambiente
```

Cada onda: `.\mvnw.cmd test` verde antes de avançar.

---

## O que NÃO fazer

- Habilitar CSRF global em API Bearer + SPA
- HSTS com HTTP local (dev)
- Testes placeholder que simulam headers sem MockMvc
- Commitar segredos reais
- RBAC/refresh token sem spec dedicada

---

## Integração spec-driven

| Artefato | Path |
|----------|------|
| Ideia | `ideas/backend-security-hardening.md` |
| Spec | `specs/backend-security-hardening/about.md` |
| Plano | `specs/backend-security-hardening/plan.md` |
| Progresso | `.cursor/sdd/progress.md` |

Antes de PR: usar skill `spec-validator` contra `about.md`.

---

## Critérios de aceite (checklist)

- [ ] CA-01: `/api/test` inacessível em prod
- [ ] CA-02: register → 403 quando flag off
- [ ] CA-03: prod exige `APP_JWT_SECRET` válido
- [ ] CA-04: forgot-password rate limited
- [ ] CA-05: headers nosniff + DENY
- [ ] CA-06: magic bytes PDF
- [ ] CA-07: limite de tamanho upload
- [ ] CA-08: suite Maven verde + MockMvc
- [ ] CA-09: frontend inalterado (sem mudança de contrato JWT)

Detalhes: [reference.md](reference.md)
