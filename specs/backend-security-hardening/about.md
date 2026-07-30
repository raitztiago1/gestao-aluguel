# Endurecimento de Segurança do Backend

## Metadados

| Campo | Valor |
|-------|-------|
| **Feature slug** | `backend-security-hardening` |
| **Status** | **Aprovada** (2026-07-30) |
| **Data** | 2026-07-30 |
| **Origem** | [ideas/backend-security-hardening.md](../../ideas/backend-security-hardening.md) |
| **Stack** | Java 25, Spring Boot 4, Spring Security 6, JWT (JJWT HS512), Next.js 14 (consumidor) |
| **Impacto** | Backend + config; **sem mudança obrigatória no frontend** |

---

## Contexto

A API já possui JWT stateless, BCrypt, rate limit no login, sanitização de entrada no fluxo de auth e CORS restrito a localhost (dev). Porém uma auditoria identificou gaps críticos para ambiente exposto:

1. Endpoints de teste públicos permitem leitura de documentos e inserção de dados.
2. Qualquer visitante pode registrar usuário e obter token.
3. Segredos e credenciais aparecem no repositório.
4. A suíte de testes de segurança não valida o `SecurityFilterChain` real.
5. Upload de PDF e headers HTTP carecem de endurecimento.

Esta spec cobre melhorias **incrementais e reversíveis**, priorizando fechamento de backdoors e observabilidade via testes — sem introduzir RBAC, refresh token ou CSRF (incompatível com SPA Bearer sem desenho adicional).

---

## Objetivo

Elevar a postura de segurança da API de **~2,5/5 para ≥4/5** nas dimensões: autorização de rotas, configuração de segredos, headers HTTP e testes de regressão — mantendo compatibilidade com o frontend atual (login, register condicional, CRUDs autenticados, upload PDF).

---

## Escopo

### Dentro do escopo

- Restringir ou desabilitar `TestController` fora de profile `dev`.
- Flag configurável para desabilitar registro público.
- Externalizar segredos sensíveis via variáveis de ambiente (com fallback dev documentado).
- Remover credenciais/comentários sensíveis de arquivos versionados.
- Rate limit no fluxo `forgot-password`.
- Headers de segurança HTTP no `SecurityConfig`.
- Limites e validação reforçada de upload PDF.
- Testes `@AutoConfigureMockMvc` que exercitam autenticação real.
- Substituir ou complementar testes placeholder em `security/` que não batem na aplicação.

### Fora do escopo

- RBAC (roles admin/operador).
- Refresh token / logout com blacklist.
- Reativar CSRF na API JWT.
- Rotação de algoritmo JWT (RS256).
- WAF, rate limit distribuído (Redis).
- Hardening do frontend (CSP no Next.js, cookies).
- Pen test externo / certificação.

---

## Personas e fluxos afetados

| Persona | Fluxo | Impacto esperado |
|---------|-------|------------------|
| Desenvolvedor local | Boot com profile `dev`, testes, seed via `/api/test` | Mantido em `dev` |
| Operador em produção | Login → JWT → CRUDs | Sem mudança de contrato |
| Atacante externo | Acesso anônimo a `/api/test`, registro em massa | Bloqueado em prod |
| Usuário legítimo | Register em prod (se flag off) | Recebe 403 com mensagem clara |
| Frontend Next.js | `Authorization: Bearer`, upload multipart | Sem alteração de headers além dos de resposta |

---

## Requisitos Funcionais

### RF-01 — TestController restrito ao profile dev

**Descrição:** Endpoints em `/api/test/**` só devem estar disponíveis quando a aplicação roda com profile Spring `dev`.

**Comportamento:**
- Profile `dev`: rotas respondem como hoje (health, check-docs, create-test-data).
- Profile `prod` (ou default sem `dev`): rotas retornam **404** (preferível a 401 para não revelar existência) **ou** bean não registrado.
- `SecurityConfig` **não** deve manter `permitAll` para `/api/test/**` em profiles não-dev.

**Arquivos prováveis:** `TestController.java`, `SecurityConfig.java`, `application-dev.properties` (opcional).

---

### RF-02 — Registro público configurável

**Descrição:** O endpoint `POST /api/auth/register` deve respeitar a propriedade `app.auth.registration-enabled`.

| Valor | Comportamento |
|-------|---------------|
| `true` (default em dev) | Registro funciona como hoje |
| `false` | Retorna **403 Forbidden** com corpo JSON `{ "message": "..." }` em português |

**Nota:** Login, forgot-password e reset-password permanecem disponíveis.

---

### RF-03 — Segredos externalizados

**Descrição:** Valores sensíveis não devem ser o único meio de configuração em arquivo versionado.

| Propriedade | Variável de ambiente sugerida | Obrigatória em prod |
|-------------|-------------------------------|---------------------|
| `app.jwt.secret` | `APP_JWT_SECRET` | Sim |
| `spring.datasource.password` | `SPRING_DATASOURCE_PASSWORD` | Sim |
| `spring.datasource.username` | `SPRING_DATASOURCE_USERNAME` | Recomendado |

**Comportamento:**
- Dev local continua funcionando com valores em `application.properties` ou `.env` não commitado.
- Documentar no README a lista de variáveis (sem valores reais).
- Remover comentário com credenciais de login em `application.properties`.

---

### RF-04 — Rate limit em forgot-password

**Descrição:** `POST /api/auth/forgot-password` deve usar o mesmo `RateLimiter` (ou instância equivalente) por e-mail, com limites configuráveis.

**Defaults (reutilizar ou espelhar login):**
- `app.rate-limit.forgot-password.max-attempts`: 5
- `app.rate-limit.forgot-password.lock-duration-minutes`: 15

**Comportamento:** Após exceder tentativas, retornar **429 Too Many Requests** ou **401** com mensagem de bloqueio temporário (consistente com login). Resposta **não** deve revelar se o e-mail existe (manter comportamento atual de silêncio no service).

---

### RF-05 — Headers de segurança HTTP

**Descrição:** `SecurityFilterChain` deve configurar headers mínimos:

| Header | Valor |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` **somente** quando `server.ssl.enabled=true` ou profile prod com HTTPS |

**Exclusão:** Não aplicar CSP restritivo que quebre Swagger ou ferramentas futuras sem análise — CSP fica fora desta spec.

---

### RF-06 — Endurecimento de upload PDF

**Descrição:** `ContratoDocumentoService.store` deve validar:

1. Tamanho máximo configurável (`app.upload.max-file-size`, default **10MB**).
2. Magic bytes `%PDF` nos primeiros bytes do arquivo (além de `Content-Type`).
3. Nome de arquivo sanitizado para `Content-Disposition` (remover `"`, `\`, `\r`, `\n`; fallback `contrato.pdf`).

**Comportamento de erro:** `400 Bad Request` com mensagem em português. Uploads PDF válidos existentes continuam funcionando.

---

### RF-07 — Testes de integração do filter chain

**Descrição:** Criar testes com `@SpringBootTest` + `@AutoConfigureMockMvc` cobrindo no mínimo:

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| T1 | `GET /api/contratos` sem token | 401 |
| T2 | `GET /api/contratos` com JWT válido | 200 |
| T3 | `GET /api/auth/login` (OPTIONS/POST público) | login OK |
| T4 | `POST /api/test/create-test-data` sem profile dev | 404 ou 401 |
| T5 | Headers de segurança em resposta autenticada | `X-Content-Type-Options`, `X-Frame-Options` presentes |
| T6 | `POST /api/auth/register` com `registration-enabled=false` | 403 |
| T7 | Upload arquivo não-PDF | 400 |

---

## Requisitos Não-Funcionais

### RN-01 — Compatibilidade retroativa

Nenhuma mudança deve exigir alteração no frontend para fluxos já implementados (login, CRUD autenticado, upload PDF), exceto mensagem amigável se registro estiver desabilitado em prod.

### RN-02 — Configuração por profile

Usar Spring Profiles (`dev`, `prod`) para diferenciar comportamento permissivo (local) vs restritivo (deploy).

### RN-03 — Verificação automatizada

Suite `.\mvnw.cmd test` deve permanecer verde. Novos testes MockMvc são gate obrigatório antes de merge.

### RN-04 — Mensagens em português

Erros expostos ao cliente mantêm idioma PT-BR, alinhado ao projeto.

### RN-05 — Sem segredos no repositório

Após implementação, `application.properties` commitado não contém senhas reais, tokens SMTP reais ou JWT secret de produção.

---

## Decisões técnicas

| Decisão | Escolha | Alternativa rejeitada | Motivo |
|---------|---------|----------------------|--------|
| CSRF | Manter desabilitado | Habilitar CSRF global | API stateless + Bearer; CSRF quebraria SPA |
| TestController em prod | Bean condicional `@Profile("dev")` | Auth obrigatória | 404 esconde superfície de ataque |
| Registro | Feature flag | Remover endpoint | Permite reabrir em dev/staging |
| JWT secret | Env var obrigatória em prod | Secret rotativo | Simplicidade; rotação fica fora do escopo |
| Testes security placeholder | Substituir por MockMvc | Manter como documentação | Falso positivo de cobertura |
| HSTS | Condicional a SSL | Sempre on | HSTS em HTTP local quebra dev |

---

## Componentes afetados (estimativa)

```text
src/main/java/.../security/SecurityConfig.java
src/main/java/.../controller/TestController.java
src/main/java/.../service/AuthenticationService.java
src/main/java/.../service/ContratoDocumentoService.java
src/main/resources/application.properties
src/main/resources/application-prod.properties   (novo, opcional)
src/test/java/.../security/SecurityFilterChainIntegrationTest.java  (novo)
src/test/java/.../service/ContratoDocumentoServiceTest.java           (novo ou estendido)
README.md  (seção variáveis de ambiente)
```

---

## Critérios de aceite

- [x] **CA-01:** Com profile `prod`, `POST /api/test/create-test-data` não insere dados (404/401).
- [x] **CA-02:** Com `app.auth.registration-enabled=false`, register retorna 403.
- [x] **CA-03:** Boot em prod falha ou loga erro claro se `APP_JWT_SECRET` ausente ou &lt; 64 bytes.
- [x] **CA-04:** Após 5 forgot-password no mesmo e-mail, próxima tentativa é bloqueada temporariamente.
- [x] **CA-05:** Resposta de API inclui `X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY`.
- [x] **CA-06:** Upload de `.exe` renomeado para `.pdf` é rejeitado (magic bytes).
- [x] **CA-07:** Upload &gt; 10MB é rejeitado.
- [x] **CA-08:** `.\mvnw.cmd test` passa incluindo novos testes MockMvc (181 testes).
- [x] **CA-09:** Frontend sem alterações de código; fluxos existentes compatíveis (lint requer setup ESLint inicial pré-existente).

---

## Verificação

```powershell
# Suite completa
.\mvnw.cmd test

# Testes de segurança (após implementação)
.\mvnw.cmd "-Dtest=SecurityFilterChainIntegrationTest" test
.\mvnw.cmd "-Dtest=ContratoDocumentoServiceTest" test

# Boot dev (TestController disponível)
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"

# Boot prod simulado
$env:APP_JWT_SECRET="change-me-super-secret-key-at-least-64-characters-long-please-change-prod"
$env:SPRING_PROFILES_ACTIVE="prod"
.\mvnw.cmd spring-boot:run
```

Frontend (sem testes automatizados):

```powershell
cd frontend; npm run lint
```

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Dev esquece profile `dev` e perde `/api/test` | Média | Documentar em README; profile default `dev` em `application.properties` |
| Prod sobe sem env vars | Média | `@PostConstruct` fail-fast no `JwtService` (já existe) + validação prod |
| Rate limit forgot-password bloqueia usuário legítimo | Baixa | Limites iguais ao login; janela 15 min |
| Testes MockMvc flaky por ordem de filters | Baixa | Usar `@Transactional` + token de teste via `JwtService` |

---

## Métricas de sucesso (pós-implementação)

| KPI | Antes | Meta |
|-----|-------|------|
| Endpoints públicos perigosos em prod | ≥3 (`/api/test/*`) | 0 |
| Testes MockMvc no filter chain | 0 | ≥7 |
| Segredos hardcoded commitados | Sim | Não |
| Rotas auth com rate limit | 1 | 2 (+ forgot-password) |
| Upload com validação de conteúdo | Content-Type only | + magic bytes + size |

---

## Gate de aprovação

1. [x] Humano revisa escopo (in/out).
2. [x] Defaults confirmados: 404 em test prod, `registration-enabled=false` em prod, upload 10MB, HSTS condicional SSL.
3. [x] Status **Aprovada** (2026-07-30).
4. [x] Plano: [`plan.md`](plan.md)

---

## Histórico

| Data | Autor | Nota |
|------|-------|------|
| 2026-07-30 | Agent (spec-writer) | Rascunho inicial a partir da auditoria de segurança |
