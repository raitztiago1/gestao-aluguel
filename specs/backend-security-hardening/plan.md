# Plano — Endurecimento de Segurança do Backend

**Spec:** [about.md](about.md) (aprovada 2026-07-30)  
**Status plano:** Pronto para implementação

---

## Ordem de execução

```text
T01 (profiles) → T02 (SecurityConfig base) → T03 (registration flag)
              → T04 (secrets/config) → T05 (forgot-password rate limit)
              → T06 (headers) → T07 (upload PDF)
              → T08 (MockMvc tests) → T09 (README + validação final)
```

T01–T04 fecham backdoors. T05–T07 endurecem superfícies. T08–T09 garantem regressão.

---

## T01 — Profile dev + TestController condicional

| Campo | Valor |
|-------|-------|
| **RFs** | RF-01, RN-02 |
| **Arquivos** | `TestController.java`, `application.properties`, `application-prod.properties` (novo) |
| **Estimativa** | ~45 min |

### Ações

1. Anotar `TestController` com `@Profile("dev")`.
2. Remover `.requestMatchers("/api/test/**").permitAll()` de `SecurityConfig` (T02 pode fazer junto — aqui só o controller).
3. Em `application.properties`: `spring.profiles.active=dev` (default local).
4. Criar `application-prod.properties` com `app.auth.registration-enabled=false`.

### Critério de aceite

- Boot com profile `prod`: `GET /api/test/health` → **404**.
- Boot com profile `dev`: `GET /api/test/health` → **200**.

### Verificação

```powershell
.\mvnw.cmd test
```

---

## T02 — SecurityConfig: remover rotas test públicas

| Campo | Valor |
|-------|-------|
| **RFs** | RF-01 |
| **Arquivos** | `SecurityConfig.java` |
| **Depende de** | T01 |
| **Estimativa** | ~30 min |

### Ações

1. Remover `permitAll` para `/api/test/**`.
2. Remover matchers legados não usados (`/api/usuarios/login`, etc.) se existirem — manter só `/api/auth/**` público.
3. Manter `OPTIONS /**` permitAll para CORS preflight.

### Critério de aceite

- Sem token: `/api/contratos` → 401; `/api/auth/login` → acessível.

### Verificação

```powershell
.\mvnw.cmd test
```

---

## T03 — Flag de registro público

| Campo | Valor |
|-------|-------|
| **RFs** | RF-02 |
| **Arquivos** | `AuthenticationService.java`, `AuthController.java` ou handler, `application.properties`, `application-prod.properties` |
| **Depende de** | T01 |
| **Estimativa** | ~45 min |

### Ações

1. Propriedade `app.auth.registration-enabled` (default `true` em dev).
2. Em `register()`: se `false`, lançar exceção mapeada para **403** + JSON `{ "message": "Cadastro público desabilitado." }`.
3. Teste unitário em `AuthenticationServiceTest`.

### Critério de aceite

- **CA-02:** `registration-enabled=false` → POST `/api/auth/register` → 403.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=AuthenticationServiceTest" test
```

---

## T04 — Externalizar segredos e limpar properties

| Campo | Valor |
|-------|-------|
| **RFs** | RF-03, RN-05 |
| **Arquivos** | `application.properties`, `application-prod.properties`, `JwtService.java` (se fail-fast prod) |
| **Estimativa** | ~45 min |

### Ações

1. Usar placeholders: `${APP_JWT_SECRET:...}` com default dev-only longo.
2. Datasource: `${SPRING_DATASOURCE_PASSWORD:postgres}` etc.
3. Remover linha 55 (comentário com credenciais admin).
4. SMTP: placeholders genéricos, sem senhas reais.
5. Em `application-prod.properties`: exigir env vars (sem defaults inseguros para JWT/DB se possível).

### Critério de aceite

- **CA-03:** Prod sem `APP_JWT_SECRET` válido → falha no boot.
- Nenhuma senha real no arquivo commitado.

### Verificação

```powershell
.\mvnw.cmd test
```

---

## T05 — Rate limit em forgot-password

| Campo | Valor |
|-------|-------|
| **RFs** | RF-04 |
| **Arquivos** | `AuthenticationService.java`, `RateLimiter.java` (opcional: namespace por ação), `application.properties` |
| **Estimativa** | ~45 min |

### Ações

1. Propriedades `app.rate-limit.forgot-password.max-attempts` e `lock-duration-minutes`.
2. Em `requestPasswordReset`: checar `rateLimiter.isLocked("forgot:" + email)` antes de processar; `recordAttempt` sempre; não vazar existência de e-mail.
3. Testes em `AuthenticationServiceTest` + `RateLimiterSecurityTest` se aplicável.

### Critério de aceite

- **CA-04:** 6ª tentativa no mesmo e-mail → bloqueio temporário.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=AuthenticationServiceTest,RateLimiterSecurityTest" test
```

---

## T06 — Headers de segurança HTTP

| Campo | Valor |
|-------|-------|
| **RFs** | RF-05 |
| **Arquivos** | `SecurityConfig.java` |
| **Depende de** | T02 |
| **Estimativa** | ~30 min |

### Ações

1. Configurar `.headers()` com `contentTypeOptions`, `frameOptions(DENY)`, `referrerPolicy(NO_REFERRER)`.
2. HSTS apenas se `server.ssl.enabled=true` (ler `@Value` ou `Environment`).

### Critério de aceite

- **CA-05:** Resposta inclui `X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY`.

### Verificação

Coberto em T08 (MockMvc).

---

## T07 — Endurecimento upload PDF

| Campo | Valor |
|-------|-------|
| **RFs** | RF-06 |
| **Arquivos** | `ContratoDocumentoService.java`, `ContratoDocumentoController.java`, `application.properties` |
| **Estimativa** | ~60 min |

### Ações

1. `spring.servlet.multipart.max-file-size=10MB` + `app.upload.max-file-size=10485760`.
2. Validar magic bytes `%PDF-` nos primeiros 5 bytes.
3. Método `sanitizeFilename()` para download header.
4. Testes unitários: PDF válido OK; bytes fake rejeitado; arquivo grande rejeitado.

### Critério de aceite

- **CA-06, CA-07** atendidos.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=ContratoDocumentoServiceTest" test
```

---

## T08 — Testes MockMvc do filter chain

| Campo | Valor |
|-------|-------|
| **RFs** | RF-07, RN-03 |
| **Arquivos** | `SecurityFilterChainIntegrationTest.java` (novo), possivelmente `src/test/resources/application-test.properties` |
| **Depende de** | T01–T07 |
| **Estimativa** | ~90 min |

### Ações

1. `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")`.
2. Implementar cenários T1–T7 da spec (token via `JwtService` + usuário de teste/mock).
3. Profile `test` sem `dev` para validar 404 em `/api/test`.
4. `@TestPropertySource` para `registration-enabled=false` no cenário T6.

### Critério de aceite

- **CA-08:** Todos os 7 cenários verdes.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=SecurityFilterChainIntegrationTest" test
.\mvnw.cmd test
```

---

## T09 — Documentação e gate final

| Campo | Valor |
|-------|-------|
| **RFs** | RF-03, RN-01 |
| **Arquivos** | `README.md` |
| **Depende de** | T01–T08 |
| **Estimativa** | ~30 min |

### Ações

1. Seção **Variáveis de ambiente** (JWT, DB, profiles prod vs dev).
2. Nota: dev usa `spring.profiles.active=dev` para `/api/test`.
3. Atualizar `.cursor/sdd/progress.md` com tasks concluídas.

### Critério de aceite

- **CA-09:** `npm run lint` no frontend sem alterações necessárias.
- README documenta deploy seguro.

### Verificação

```powershell
.\mvnw.cmd test
cd frontend; npm run lint
```

---

## Checklist de conclusão da feature

| CA | Task |
|----|------|
| CA-01 | T01 + T08 |
| CA-02 | T03 + T08 |
| CA-03 | T04 |
| CA-04 | T05 |
| CA-05 | T06 + T08 |
| CA-06, CA-07 | T07 + T08 |
| CA-08 | T08 |
| CA-09 | T09 |

---

## Próximo passo

Implementar com **`/implementa o plano`** ou task a task (ex.: **executa T01**).

Após todas as tasks: **`spec-validator`** → `reviews/backend-security-hardening-2026-07-30.md`.
