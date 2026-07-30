# Limpeza e Otimização de Arquivos

## Metadados

| Campo | Valor |
|-------|-------|
| **Feature slug** | `limpeza-otimizacao-arquivos` |
| **Status** | **Implementada** (Ondas 1–2) |
| **Data** | 2026-07-30 |
| **Origem** | [ideas/limpeza-otimizacao-arquivos.md](../../ideas/limpeza-otimizacao-arquivos.md) |
| **Stack** | Java 25, Spring Boot 4, Flyway, Next.js 14 (App Router), React 18, TypeScript 5 |
| **Impacto** | Raiz do repositório, `docs/`, `scripts/dev/`, `.gitignore`, migrações Flyway; Onda 3 (opcional) toca frontend CRUD |

---

## Contexto

Após as ondas de usabilidade (`usabilidade-pos-revisao`) e security hardening (`backend-security-hardening`), o repositório acumulou artefatos acidentais, documentação desatualizada e um conflito crítico de migrações Flyway. Isso aumenta o custo de onboarding, induz decisões com base em informação errada (ex.: contagem de testes) e impede fresh install via Docker.

**Baseline (inventário 2026-07-30):**

| Sintoma | Evidência |
|---------|-----------|
| Arquivos órfãos na raiz | `FileStorageService.java` (0 bytes), `package-lock.json` vazio (`packages: {}`), 6 PNGs de revisão Playwright |
| Cache versionado | `frontend/tsconfig.tsbuildinfo` |
| Docs desatualizados na raiz | `TEST_SUMMARY.md` cita **60** testes; suite atual: **186** |
| Conflito Flyway | Dois arquivos `V2__*`: `V2__create_usuario_table.sql` (redundante — `usuario` já em `V1__init.sql` L539+) e `V2__add_contrato_documento.sql` (válida) |
| Scripts SQL ad-hoc na raiz | `test-data.sql`, `test-query.sql`, `check-db.sql` |
| Duplicação estrutural frontend | Padrões copiados em 5 páginas CRUD; `home/page.tsx` com ~789 linhas |

**Pontos fortes a preservar:** specs/reviews concluídas, skill local `backend-security-hardening`, entidades/repos de domínio incompleto (roadmap), `README.md` pós-hardening, componentes já extraídos (`SortableTh`, `useEscapeKey`, `ErrorAlert`, etc.).

---

## Objetivo

Reduzir ruído no repositório, consolidar documentação com fonte de verdade única, corrigir migrações Flyway para fresh install confiável e — **fase opcional/deferida** — iniciar DRY no frontend sem apagar domínios pendentes do roadmap.

---

## Escopo por onda

### Onda 1 — Higiene do repositório (~1–2 h, baixo risco)

| Prioridade | Itens |
|------------|-------|
| **P0** | Remover lixo confirmado na raiz (Java órfão, lockfile vazio, PNGs, cache TS) |
| **P1** | Atualizar `.gitignore` para impedir re-commit de artefatos |
| **P2** | Criar `scripts/dev/` e mover SQLs ad-hoc |
| **P3** | Arquivar/consolidar docs desatualizados; atualizar `README.md` |

### Onda 2 — Flyway e scripts de verificação (~2 h, risco médio)

| Prioridade | Itens |
|------------|-------|
| **P0** | Auditar `flyway_schema_history` em ambientes existentes |
| **P1** | Remover `V2__create_usuario_table.sql` (redundante) |
| **P2** | Renumerar `V2__add_contrato_documento.sql` → `V6__add_contrato_documento.sql` |
| **P3** | Script `scripts/dev/check-flyway-history.sql`; validar fresh install Docker |

### Onda 3 — DRY frontend (**opcional / deferida**)

> **Decisão de escopo:** Onda 3 **não bloqueia** aprovação das Ondas 1–2. Só entra em implementação após aprovação explícita desta fase ou via spec futura `frontend-crud-dry` (alinhada ao “Onda 2+” da spec `usabilidade-pos-revisao`). Inclui apenas `FormModal` e `PagamentosModal` — **não** `useCrudList` nem `EntityTable`.

| Prioridade | Itens | Status |
|------------|-------|--------|
| **P1** | Extrair `FormModal` (overlay, escape, erro interno, footer) | Deferido |
| **P2** | Extrair `PagamentosModal` de `home/page.tsx` | Deferido |
| **P3** | Adotar `FormModal` em 1 página piloto (ex.: salas) | Deferido |

---

## Fora de escopo

- Deletar entidades/repos de domínio incompleto: `Fiador`, `Caucao`, `ConfiguracaoLocador` e respectivos repositories.
- Remover `TerrenoDTO` (decisão pertence a spec de Terrenos v2 ou implementação de API).
- Squash total de migrações Flyway ou substituir Flyway por `ddl-auto=update`.
- Suite de testes automatizados no frontend (não existe).
- Refatorações DRY avançadas: `useCrudList<T>`, `EntityTable`, rewrite com TanStack Table.
- Layout em cards no mobile (spec `usabilidade-pos-revisao`, Onda 2+).
- Implementar features pendentes de Fiador, Caução ou Configuração Locador (specs separadas).
- Alterações de comportamento de runtime (API, regras de negócio, UI funcional) além do necessário para extrair componentes na Onda 3.

---

## Requisitos Funcionais

### Onda 1 — Higiene

#### RF-01 — Remover arquivos órfãos confirmados na raiz

**Descrição:** Eliminar artefatos acidentais que não participam do build nem da documentação viva.

**Arquivos alvo:**

| Arquivo | Ação | Evidência |
|---------|------|-----------|
| `FileStorageService.java` (raiz) | Deletar | 0 bytes; upload real em `ContratoDocumentoService` |
| `ContratoRequestDTO.java` (raiz) | Deletar se existir | Duplicata; canônico em `src/.../dto/ContratoRequestDTO.java` |
| `package-lock.json` (raiz) | Deletar | Lockfile vazio; frontend tem o próprio em `frontend/` |
| `01-dashboard-vazio.png` … `06-mobile-modal.png` | Deletar | Screenshots Playwright; conteúdo preservado em `reviews/` e spec usabilidade |
| `frontend/tsconfig.tsbuildinfo` | Deletar | Cache de compilação TypeScript |

**Critério de aceite:**
- Nenhum dos arquivos acima permanece versionado após a onda.
- `git status` na raiz não lista `.java`, `.png` de revisão ou `package-lock.json` na raiz.
- Build e testes permanecem verdes (ver seção Verificação).

---

#### RF-02 — Impedir re-commit de artefatos de build

**Descrição:** Atualizar `.gitignore` para caches e artefatos gerados.

**Comportamento:**
- Adicionar `*.tsbuildinfo` (ou `frontend/tsconfig.tsbuildinfo` explicitamente).
- Se PNGs forem movidos em vez de deletados (alternativa rejeitada para esta spec — ver Decisões), `docs/assets/` seria ignorado; **decisão:** deletar PNGs, não mover.

**Critério de aceite:**
- Após `npm run build` em `frontend/`, `tsconfig.tsbuildinfo` não aparece como untracked no git.

---

#### RF-03 — Reorganizar scripts SQL de desenvolvimento

**Descrição:** Centralizar scripts ad-hoc úteis em `scripts/dev/`.

**Mapeamento:**

| Origem (raiz) | Destino |
|---------------|---------|
| `test-data.sql` | `scripts/dev/seed-test-data.sql` |
| `test-query.sql` | `scripts/dev/test-query.sql` |
| `check-db.sql` | `scripts/dev/check-db.sql` |

**Comportamento:**
- Criar diretório `scripts/dev/` se não existir.
- Remover arquivos originais da raiz após mover.
- Adicionar ao `README.md` uma linha por script descrevendo uso (ex.: seed manual para QA).

**Critério de aceite:**
- Raiz sem `*.sql` ad-hoc.
- Scripts executáveis via `psql` documentados no README.

---

#### RF-04 — Consolidar documentação desatualizada

**Descrição:** Reduzir docs na raiz; arquivar histórico; eliminar contagem de testes obsoleta.

**Ações por arquivo:**

| Arquivo | Ação |
|---------|------|
| `REVISAO_USABILIDADE.md` | Mover para `docs/historico/revisao-usabilidade-2026-07.md` |
| `TEST_PLAN.md` | Mover para `docs/historico/test-plan-inicial.md` |
| `TEST_SUMMARY.md` | **Deletar** (CI + `mvnw test` são fonte de verdade; contagem 60 está errada) |
| `SECURITY_TESTS_SUMMARY.md` | Mover para `docs/testes/seguranca.md`; revisar contagem de testes |
| `AUTH_SETUP.md` | Fundir trechos únicos no README; mover restante para `docs/historico/auth-setup.md` ou deletar após fusão |
| `USER_MANUAL_PRINTABLE.html` | Mover para `docs/manual/user-manual-printable.html` |

**Comportamento:**
- Antes de mover/deletar: `grep`/busca por links quebrados em `README.md`, `specs/`, `ideas/`, `reviews/`.
- Atualizar referências em specs (ex.: link para `REVISAO_USABILIDADE.md` → novo path em `docs/historico/`).

**Critério de aceite:**
- Raiz contém apenas `README.md` como doc principal (+ artefatos de build config).
- Nenhum doc na raiz afirma contagem de testes desatualizada.
- `docs/testes/seguranca.md` reflete estado pós-hardening (contagem ≥186 ou referência dinâmica ao CI).

---

#### RF-05 — README como fonte de verdade operacional

**Descrição:** README deve apontar para novos paths de docs e scripts sem duplicar conteúdo extenso.

**Comportamento:**
- Seção **Testes**: comando `.\mvnw.cmd test` como verificação; sem número fixo desatualizado (ou atualizar para contagem verificada na implementação).
- Seção **Scripts de desenvolvimento**: links para `scripts/dev/*.sql`.
- Seção **Documentação**: links para `docs/historico/`, `docs/testes/`, `docs/manual/` quando aplicável.
- Menção explícita de entidades “stub” no roadmap (`Fiador`, `Caucao`, `ConfiguracaoLocador`) — referência a `ideas/mapeamento-features-sistema.md`.

**Critério de aceite:**
- Novo contribuidor encontra scripts e docs históricos a partir do README sem buscar na raiz.

---

### Onda 2 — Flyway

#### RF-06 — Auditar histórico Flyway antes de alterar migrations

**Descrição:** Verificar estado de `flyway_schema_history` em bancos existentes (local, Docker, staging) antes de remover/renumerar arquivos.

**Comportamento:**
- Executar consulta equivalente a:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

- Documentar no PR/review quais versões V2–V6 já foram aplicadas.
- Se `V2__create_usuario_table` consta no histórico mas schema já tem `usuario` via V1: planejar repair (`DELETE` da linha órfã ou `flyway repair`) — **não** reexecutar migration removida.

**Critério de aceite:**
- Checklist preenchido antes do merge da Onda 2 (evidência em review ou comentário de PR).

---

#### RF-07 — Remover migration redundante de `usuario`

**Descrição:** Deletar `src/main/resources/db/migration/V2__create_usuario_table.sql`.

**Comportamento:**
- Tabela `usuario` permanece definida apenas em `V1__init.sql` (L539+).
- Nenhum código ou teste referencia o arquivo removido.

**Critério de aceite:**
- Arquivo ausente do repositório.
- Fresh install (RF-10) cria tabela `usuario` via V1 sem erro.

---

#### RF-08 — Renumerar migration de `contrato_documento`

**Descrição:** Resolver conflito de versão duplicada `V2__*`.

**Comportamento:**
- Renomear `V2__add_contrato_documento.sql` → `V6__add_contrato_documento.sql` (próxima versão livre após V5).
- Conteúdo SQL inalterado (tabela `contrato_documento` + índice).
- Ordem de aplicação em fresh install: V1 → V3 → V4 → V5 → V6 (V2 ausente intencionalmente).

**Critério de aceite:**
- Exatamente um arquivo por prefixo de versão em `db/migration/`.
- Nenhum par `V2__*.sql` duplicado.

---

#### RF-09 — Script de verificação Flyway para desenvolvedores

**Descrição:** Fornecer script SQL reutilizável para QA local.

**Comportamento:**
- Criar `scripts/dev/check-flyway-history.sql` com consulta de RF-06 + checagens úteis (versões esperadas, gaps).
- Documentar no README.

**Critério de aceite:**
- Script presente e executável contra banco Docker local.

---

#### RF-10 — Fresh install via Docker sem erro Flyway

**Descrição:** Validar que ambiente limpo sobe e aplica todas as migrations.

**Comportamento:**
- `docker compose down -v` (volume limpo).
- `docker compose up --build` (ou equivalente documentado).
- Backend inicia; Flyway aplica V1, V3, V4, V5, V6 sem exceção.
- Tabela `contrato_documento` existe após boot.

**Critério de aceite:**
- Log do backend sem `FlywayException` ou conflito de versão.
- `.\mvnw.cmd test` verde contra banco de testes (H2/Testcontainers conforme projeto).

---

### Onda 3 — DRY frontend (opcional / deferida)

> Implementar **somente** após aprovação explícita desta fase. Gates: Ondas 1–2 concluídas e validadas.

#### RF-11 — Componente `FormModal` compartilhado *(deferido)*

**Descrição:** Extrair padrão repetido de modal de formulário usado em páginas CRUD.

**Comportamento:**
- Props mínimas: `open`, `onClose`, `title`, `erroModal`, `children` (form body), `footer` (ações).
- Integrar `useEscapeKey` e `ErrorAlert` internamente.
- Foco inicial no modal; overlay fecha ou não conforme padrão atual de locatários (referência madura).

**Critério de aceite:**
- Componente em `frontend/app/components/FormModal.tsx`.
- Comportamento equivalente ao modal inline atual em pelo menos smoke manual.

---

#### RF-12 — Extrair `PagamentosModal` do dashboard *(deferido)*

**Descrição:** Reduzir tamanho de `frontend/app/home/page.tsx` movendo modal de pagamentos.

**Comportamento:**
- Novo componente `PagamentosModal.tsx` (ou path equivalente em `components/`).
- `home/page.tsx` reduz ≥20% de linhas vs. baseline (~789).

**Critério de aceite:**
- `home/page.tsx` ≤ ~630 linhas (meta ≥20% redução).
- Fluxo pagamentos inalterado em smoke manual (login → registrar pagamento).

---

#### RF-13 — Página piloto com `FormModal` *(deferido)*

**Descrição:** Validar componente em uma página antes de propagar.

**Comportamento:**
- Adotar `FormModal` em **uma** página piloto (recomendado: `salas/page.tsx`).
- Demais páginas CRUD permanecem inalteradas nesta spec (propagação = spec futura).

**Critério de aceite:**
- Piloto usa `FormModal`; lint + build verdes.
- Erro de validação visível dentro do modal (regressão RF-03 usabilidade).

---

## Regras de Negócio e Técnicas

| ID | Tipo | Descrição |
|----|------|-----------|
| RN-01 | Negócio | **Não deletar** entidades/repos `Fiador`, `Caucao`, `ConfiguracaoLocador` — fazem parte do roadmap (garantia XOR, singleton locador). |
| RN-02 | Negócio | Regras críticas em `constituicao.mdc` permanecem inalteradas; esta feature não altera domínio. |
| RN-03 | Técnica | Flyway é a única fonte de schema em ambientes reais; proibido `ddl-auto=update` como substituto. |
| RN-04 | Técnica | Contagem de testes: `.\mvnw.cmd test` e CI são fonte de verdade — docs não fixam número stale. |
| RN-05 | Técnica | Onda 3 não regressa RF-03/RF-08 da spec `usabilidade-pos-revisao` (erros no modal, Escape). |
| RN-06 | Técnica | Links internos em specs/reviews devem ser atualizados ao mover docs (RF-04). |
| RN-07 | Técnica | `TestController` (`@Profile("dev")`) e skill `.cursor/skills/backend-security-hardening/` permanecem. |

---

## Requisitos Não Funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | `.\mvnw.cmd test` verde após Ondas 1–2 (186 testes na baseline). |
| RNF-02 | `npm run lint` e `npm run build` verdes após qualquer onda que toque frontend. |
| RNF-03 | Fresh install Docker (RF-10) obrigatório antes de considerar Onda 2 concluída. |
| RNF-04 | Mudanças incrementais por onda; Onda 3 isolada em PR separado se implementada. |
| RNF-05 | Idioma de docs e mensagens: português (Brasil). |

---

## Decisões técnicas

| Decisão | Escolha | Alternativa rejeitada | Motivo |
|---------|---------|----------------------|--------|
| PNGs de revisão | Deletar | Mover para `docs/assets/` | Conteúdo já em reviews/spec; reduz ruído na raiz |
| `TEST_SUMMARY.md` | Deletar | Atualizar contagem | CI/testes são fonte dinâmica; evita novo drift |
| Flyway `contrato_documento` | Renumerar para V6 | Manter V2 após remover usuario V2 | Evita colisão em DBs que registraram V2 usuario |
| Squash migrations | Fora de escopo | V1 único | Perigoso para prod; perde histórico |
| Onda 3 | Deferida nesta spec | Incluir `useCrudList` + `EntityTable` | Escopo grande; alinhar com usabilidade Onda 2+ / spec futura |
| `TerrenoDTO` | Manter | Deletar agora | Decisão pertence a feature Terrenos |
| Propagação `FormModal` | 1 piloto apenas | 5 páginas de uma vez | Reduz risco de regressão |

---

## Critérios de aceite globais (Definition of Done)

### Ondas 1–2 (obrigatórias)

1. Raiz sem PNGs, `.java` soltos, lockfile vazio ou `*.sql` ad-hoc.
2. `docs/` organizado; `TEST_SUMMARY.md` removido; segurança em `docs/testes/seguranca.md`.
3. `.gitignore` impede `*.tsbuildinfo` versionado.
4. Flyway: um arquivo por versão; fresh install Docker sem erro.
5. `.\mvnw.cmd test`, `npm run lint`, `npm run build` verdes.
6. README atualizado com scripts e pointers de documentação.

### Onda 3 (se aprovada e implementada)

7. `FormModal` extraído; piloto em salas funcional.
8. `PagamentosModal` extraído; `home/page.tsx` reduzido ≥20%.
9. Smoke manual pagamentos + modal com erro de validação OK.

---

## Verificação

### Backend (Ondas 1–2)

```powershell
# Suite completa — gate obrigatório
.\mvnw.cmd test

# Compilar sem testes (sanidade rápida pós-remoção de arquivos)
.\mvnw.cmd clean compile
```

### Frontend (Ondas 1 e 3)

```powershell
cd frontend; npm run lint
cd frontend; npm run build
```

### Flyway — fresh install Docker (Onda 2 — gate obrigatório)

```powershell
# Banco limpo
docker compose down -v

# Subir stack e aguardar backend healthy
docker compose up --build -d

# Verificar histórico Flyway (ajuste credenciais se necessário)
docker exec -it gestao-aluguel-db psql -U postgres -d gestao_aluguel -f /dev/stdin < scripts/dev/check-flyway-history.sql

# Ou via psql local na porta exposta
psql -h localhost -U postgres -d gestao_aluguel -f scripts/dev/check-flyway-history.sql
```

### Checklist pós-Onda 1

```powershell
# Raiz limpa (PowerShell — ajustar se paths diferirem)
Get-ChildItem -Path . -File | Where-Object { $_.Extension -in '.png','.java','.sql' -and $_.DirectoryName -eq (Get-Location).Path }

# Links quebrados para docs movidos
rg "REVISAO_USABILIDADE\.md|TEST_PLAN\.md|TEST_SUMMARY\.md|AUTH_SETUP\.md" --glob "*.md"
```

### Smoke manual (Onda 3 — se implementada)

1. Login → abrir modal pagamentos no dashboard → registrar pagamento → sucesso.
2. Abrir modal salas (piloto) → submit inválido → erro visível dentro do modal.
3. Escape fecha modal em salas e pagamentos.

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Deletar migration já aplicada em prod | Média | RF-06 audit antes; repair Flyway documentado |
| Links quebrados após mover docs | Média | Grep em README/specs/reviews (RF-04) |
| Fresh install falha por ordem V2 ausente | Baixa | RF-10 gate; V6 explícito |
| Onda 3 quebra a11y/erros no modal | Média | Piloto único; copiar padrão locatários; smoke RF-03 |
| Confundir stub de domínio com lixo | Baixa | RN-01 + README roadmap |

---

## Métricas de sucesso

| Métrica | Baseline | Meta (Ondas 1–2) | Meta (Onda 3, se feita) |
|---------|----------|------------------|-------------------------|
| Arquivos lixo na raiz | 9+ | 0 | 0 |
| Docs MD obsoletos na raiz | 6 auxiliares | 0 (só README) | 0 |
| Migrações `V2__*` conflitantes | 2 | 0 | 0 |
| Contagem testes em docs | 60 (errado) | Nenhuma stale | — |
| Linhas `home/page.tsx` | ~789 | — | ≤ ~630 |

---

## Referências

- [ideas/limpeza-otimizacao-arquivos.md](../../ideas/limpeza-otimizacao-arquivos.md) — inventário e alternativas
- [specs/usabilidade-pos-revisao/about.md](../usabilidade-pos-revisao/about.md) — `FormModal` adiado para Onda 2+
- [specs/backend-security-hardening/about.md](../backend-security-hardening/about.md) — docs de segurança atualizados
- [ideas/mapeamento-features-sistema.md](../../ideas/mapeamento-features-sistema.md) — roadmap de domínio incompleto

---

## Gate de aprovação

| # | Item | Status |
|---|------|--------|
| 1 | Humano revisa escopo Ondas 1–2 (in/out) | ☑ Concluído |
| 2 | Humano decide se Onda 3 entra agora ou fica deferida | ☑ Concluído (Onda 3 deferida) |
| 3 | Confirmar estratégia Flyway (remover V2 usuario + V6 contrato_documento) | ☑ Concluído |
| 4 | Status **Aprovada** → liberar `spec-planner` para `plan.md` | ☑ Concluído |

**Status atual:** **Implementada (Ondas 1–2)** — review: [reviews/limpeza-otimizacao-arquivos-2026-07-30.md](../../reviews/limpeza-otimizacao-arquivos-2026-07-30.md). Onda 3 deferida.

---

## Histórico

| Data | Autor | Nota |
|------|-------|------|
| 2026-07-30 | Agent (spec-writer) | Rascunho inicial a partir de idea-refine aprovada |
| 2026-07-30 | Humano + Agent (spec-planner) | Spec aprovada; Ondas 1–2 in scope; Onda 3 deferida; plan.md criado |
