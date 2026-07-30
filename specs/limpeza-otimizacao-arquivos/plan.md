# Plano — Limpeza e Otimização de Arquivos

**Spec:** [about.md](about.md) (aprovada 2026-07-30)  
**Status plano:** Implementado (Ondas 1–2)

**Escopo deste plano:** Ondas 1–2 (obrigatórias). Onda 3 (DRY frontend) **deferida** — ver seção [Fora deste plano](#fora-deste-plano-onda-3-deferida).

---

## Ordem de execução

```text
Onda 1 — Higiene
  T01 (RF-01 órfãos) → T02 (RF-02 .gitignore) → T03 (RF-03 scripts/dev)
                   → T04 (RF-04 docs) → T05 (RF-05 README + links)

Onda 2 — Flyway
  T06 (RF-06 audit) → T07 (RF-07 remover V2 usuario) → T08 (RF-08 renumerar V6)
                 → T09 (RF-09 check-flyway script) → T10 (validação final + RF-10 Docker)
```

T01–T03 reduzem ruído sem tocar schema. T04–T05 consolidam documentação. T06 bloqueia alterações Flyway até audit documentado. T07–T08 corrigem conflito de versão. T09–T10 fecham gates de fresh install e regressão.

---

## T01 — RF-01: Remover arquivos órfãos confirmados na raiz

| Campo | Valor |
|-------|-------|
| **RFs** | RF-01, RN-01 |
| **Arquivos** | `FileStorageService.java`, `package-lock.json` (raiz), `01-dashboard-vazio.png` … `06-mobile-modal.png`, `frontend/tsconfig.tsbuildinfo`; deletar `ContratoRequestDTO.java` na raiz **se existir** |
| **Estimativa** | ~30 min |

### Ações

1. Deletar `FileStorageService.java` (0 bytes; upload real em `ContratoDocumentoService`).
2. Deletar `package-lock.json` na raiz (lockfile vazio; canônico em `frontend/package-lock.json`).
3. Deletar os 6 PNGs de revisão Playwright na raiz (`01-` … `06-`).
4. Deletar `frontend/tsconfig.tsbuildinfo` se versionado.
5. Confirmar ausência de `ContratoRequestDTO.java` na raiz (canônico em `src/.../dto/`).
6. **Não** deletar entidades/repos stub (`Fiador`, `Caucao`, `ConfiguracaoLocador`, `TerrenoDTO`).

### Critério de aceite

- Nenhum dos arquivos acima permanece no repositório.
- `git status` na raiz não lista `.java`, `.png` de revisão ou `package-lock.json` na raiz.

### Verificação

```powershell
Get-ChildItem -Path . -File | Where-Object { $_.Extension -in '.png','.java' -and $_.DirectoryName -eq (Get-Location).Path }
.\mvnw.cmd clean compile
cd frontend; npm run lint
```

---

## T02 — RF-02: Impedir re-commit de artefatos de build

| Campo | Valor |
|-------|-------|
| **RFs** | RF-02 |
| **Arquivos** | `.gitignore` |
| **Depende de** | T01 |
| **Estimativa** | ~15 min |

### Ações

1. Adicionar `*.tsbuildinfo` ao `.gitignore` (cobre `frontend/tsconfig.tsbuildinfo` e futuros caches TS).
2. Confirmar que `.next/`, `target/`, `node_modules/` já estão ignorados (não alterar se OK).

### Critério de aceite

- Após `npm run build` em `frontend/`, `tsconfig.tsbuildinfo` não aparece como untracked no git.

### Verificação

```powershell
cd frontend; npm run build
git status --short frontend/tsconfig.tsbuildinfo
```

---

## T03 — RF-03: Reorganizar scripts SQL de desenvolvimento

| Campo | Valor |
|-------|-------|
| **RFs** | RF-03 |
| **Arquivos** | Criar `scripts/dev/`; mover `test-data.sql` → `scripts/dev/seed-test-data.sql`, `test-query.sql` → `scripts/dev/test-query.sql`, `check-db.sql` → `scripts/dev/check-db.sql` |
| **Estimativa** | ~30 min |

### Ações

1. Criar diretório `scripts/dev/` se não existir.
2. Mover/renomear os três SQLs da raiz conforme mapeamento da spec.
3. Remover originais da raiz após mover.
4. Conteúdo SQL inalterado (só relocalização).

### Critério de aceite

- Raiz sem `*.sql` ad-hoc.
- Três scripts presentes em `scripts/dev/`.

### Verificação

```powershell
Get-ChildItem -Path . -Filter *.sql -File
Get-ChildItem scripts/dev/
```

---

## T04 — RF-04: Consolidar documentação desatualizada

| Campo | Valor |
|-------|-------|
| **RFs** | RF-04, RN-04, RN-06 |
| **Arquivos** | `REVISAO_USABILIDADE.md`, `TEST_PLAN.md`, `TEST_SUMMARY.md`, `SECURITY_TESTS_SUMMARY.md`, `AUTH_SETUP.md`, `USER_MANUAL_PRINTABLE.html`; criar `docs/historico/`, `docs/testes/`, `docs/manual/` |
| **Estimativa** | ~75 min |

### Ações

1. Criar estrutura `docs/historico/`, `docs/testes/`, `docs/manual/` se ausente.
2. Mover `REVISAO_USABILIDADE.md` → `docs/historico/revisao-usabilidade-2026-07.md`.
3. Mover `TEST_PLAN.md` → `docs/historico/test-plan-inicial.md`.
4. **Deletar** `TEST_SUMMARY.md` (contagem 60 obsoleta).
5. Mover `SECURITY_TESTS_SUMMARY.md` → `docs/testes/seguranca.md`; revisar texto para pós-hardening (sem contagem stale — referir `.\mvnw.cmd test` ou CI).
6. Fundir trechos únicos de `AUTH_SETUP.md` no README (T05); mover restante → `docs/historico/auth-setup.md` ou deletar após fusão.
7. Mover `USER_MANUAL_PRINTABLE.html` → `docs/manual/user-manual-printable.html`.
8. Antes de concluir: `rg` por links quebrados para paths antigos em `README.md`, `specs/`, `ideas/`, `reviews/` — corrigir referências (ex.: `specs/usabilidade-pos-revisao/about.md` apontando para `REVISAO_USABILIDADE.md` na raiz).

### Critério de aceite

- Raiz contém apenas `README.md` como doc principal (+ configs de build).
- Nenhum doc na raiz afirma contagem de testes desatualizada.
- `docs/testes/seguranca.md` existe e reflete estado pós-hardening.
- Zero matches em grep por paths antigos não redirecionados.

### Verificação

```powershell
rg "REVISAO_USABILIDADE\.md|TEST_PLAN\.md|TEST_SUMMARY\.md|AUTH_SETUP\.md|SECURITY_TESTS_SUMMARY\.md" --glob "*.md"
Get-ChildItem -Path . -Filter *.md -File
Test-Path docs/testes/seguranca.md
```

---

## T05 — RF-05: README como fonte de verdade operacional

| Campo | Valor |
|-------|-------|
| **RFs** | RF-05, RN-01, RN-04 |
| **Arquivos** | `README.md` |
| **Depende de** | T03, T04 |
| **Estimativa** | ~45 min |

### Ações

1. Seção **Testes**: `.\mvnw.cmd test` como verificação; sem número fixo desatualizado.
2. Seção **Scripts de desenvolvimento**: uma linha por script em `scripts/dev/*.sql` (seed, query, check-db).
3. Seção **Documentação**: links para `docs/historico/`, `docs/testes/seguranca.md`, `docs/manual/`.
4. Menção explícita de entidades stub no roadmap (`Fiador`, `Caucao`, `ConfiguracaoLocador`) → `ideas/mapeamento-features-sistema.md`.
5. Incorporar trechos únicos de `AUTH_SETUP.md` ainda não cobertos (env vars JWT, fluxo auth).

### Critério de aceite

- Novo contribuidor encontra scripts e docs históricos a partir do README sem buscar na raiz.
- Nenhuma contagem de testes hardcoded obsoleta no README.

### Verificação

Revisão manual do README + grep:

```powershell
rg "60 testes|186 testes" README.md docs/
```

---

## T06 — RF-06: Auditar histórico Flyway antes de alterar migrations

| Campo | Valor |
|-------|-------|
| **RFs** | RF-06, RN-03 |
| **Arquivos** | Nenhum código — evidência em `reviews/limpeza-otimizacao-arquivos-YYYY-MM-DD.md` (criar na T10) ou nota no PR |
| **Depende de** | T01–T05 (Onda 1 concluída) |
| **Estimativa** | ~30 min |

### Ações

1. Em banco local/Docker existente, executar:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

2. Documentar quais versões V1–V6 (e V2 duplicado se existir) já foram aplicadas.
3. Se `V2__create_usuario_table` consta no histórico mas schema tem `usuario` via V1: planejar **repair** (`DELETE` da linha órfã ou `flyway repair`) — **não** reexecutar migration removida.
4. Checklist preenchido **antes** de T07/T08.

### Critério de aceite

- Evidência documentada de audit (review ou comentário) com decisão de repair se aplicável.
- Nenhuma alteração de arquivo de migration nesta task.

### Verificação

```powershell
docker exec gestao-aluguel-db psql -U postgres -d gestao_aluguel -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

---

## T07 — RF-07: Remover migration redundante de `usuario`

| Campo | Valor |
|-------|-------|
| **RFs** | RF-07 |
| **Arquivos** | `src/main/resources/db/migration/V2__create_usuario_table.sql` (deletar) |
| **Depende de** | T06 |
| **Estimativa** | ~20 min |

### Ações

1. Deletar `V2__create_usuario_table.sql`.
2. Confirmar tabela `usuario` permanece definida em `V1__init.sql` (L539+).
3. Se T06 indicou repair: aplicar repair no banco local antes de testar boot.

### Critério de aceite

- Arquivo ausente do repositório.
- Nenhum par `V2__*.sql` duplicado restante (antes de T08).

### Verificação

```powershell
Get-ChildItem src/main/resources/db/migration/V2__*.sql
.\mvnw.cmd test
```

---

## T08 — RF-08: Renumerar migration de `contrato_documento`

| Campo | Valor |
|-------|-------|
| **RFs** | RF-08 |
| **Arquivos** | Renomear `V2__add_contrato_documento.sql` → `V6__add_contrato_documento.sql` |
| **Depende de** | T07 |
| **Estimativa** | ~20 min |

### Ações

1. Renomear arquivo (conteúdo SQL **inalterado**).
2. Confirmar ordem fresh install: V1 → V3 → V4 → V5 → V6 (V2 ausente intencionalmente).
3. Se banco existente já aplicou `V2__add_contrato_documento`: documentar repair/update em `flyway_schema_history` (version `2` → `6` ou equivalente) — não reexecutar DDL.

### Critério de aceite

- Exatamente um arquivo por prefixo de versão em `db/migration/`.
- Nenhum par `V2__*.sql` duplicado.

### Verificação

```powershell
Get-ChildItem src/main/resources/db/migration/
.\mvnw.cmd test
```

---

## T09 — RF-09: Script de verificação Flyway para desenvolvedores

| Campo | Valor |
|-------|-------|
| **RFs** | RF-09 |
| **Arquivos** | `scripts/dev/check-flyway-history.sql` (novo), `README.md` (linha de uso) |
| **Depende de** | T08 |
| **Estimativa** | ~30 min |

### Ações

1. Criar `scripts/dev/check-flyway-history.sql` com:
   - Consulta de histórico (`installed_rank`, `version`, `description`, `success`).
   - Checagens úteis: versões esperadas (1, 3, 4, 5, 6), gaps, migrations falhas.
2. Documentar execução no README (psql local ou `docker exec`).

### Critério de aceite

- Script presente e executável contra banco Docker local.
- README referencia o script.

### Verificação

```powershell
docker exec -i gestao-aluguel-db psql -U postgres -d gestao_aluguel -f - < scripts/dev/check-flyway-history.sql
```

---

## T10 — Validação final: RF-10 Docker fresh install + gates globais

| Campo | Valor |
|-------|-------|
| **RFs** | RF-10; todos RFs Ondas 1–2; RNF-01–RNF-05; Definition of Done #1–#6 |
| **Arquivos** | `reviews/limpeza-otimizacao-arquivos-2026-07-30.md`, `.cursor/sdd/progress.md`, status em `about.md` |
| **Depende de** | T01–T09 |
| **Estimativa** | ~90 min |

### Ações

1. **Fresh install Docker (RF-10):**
   - `docker compose down -v`
   - `docker compose up --build -d`
   - Aguardar backend healthy; log sem `FlywayException`.
   - Executar `scripts/dev/check-flyway-history.sql` — versões 1, 3, 4, 5, 6 aplicadas.
   - Confirmar tabela `contrato_documento` existe.
2. **Regressão backend:** `.\mvnw.cmd test` (186 testes baseline).
3. **Regressão frontend:** `cd frontend; npm run lint; npm run build`.
4. **Checklist pós-Onda 1:** raiz limpa (PowerShell do about.md).
5. Rodar **spec-validator** → relatório em `reviews/limpeza-otimizacao-arquivos-2026-07-30.md`.
6. Atualizar status do about.md e `progress.md`.

### Critério de aceite

- Todos os **CA globais Ondas 1–2** (#1–#6 do about.md) com evidência documentada.
- Fresh install Docker sem erro Flyway.
- Review sem gaps bloqueantes.

### Verificação

```powershell
docker compose down -v
docker compose up --build -d
docker logs gestao-aluguel-backend 2>&1 | Select-String -Pattern "FlywayException" -NotMatch
docker exec -i gestao-aluguel-db psql -U postgres -d gestao_aluguel -c "\dt contrato_documento"
.\mvnw.cmd test
cd frontend; npm run lint; npm run build
Get-ChildItem -Path . -File | Where-Object { $_.Extension -in '.png','.java','.sql' -and $_.DirectoryName -eq (Get-Location).Path }
```

---

## Fora deste plano (Onda 3 — deferida)

> **Não implementar** neste ciclo. Requer aprovação explícita ou spec futura `frontend-crud-dry`.

| RF | Item | Quando |
|----|------|--------|
| RF-11 | Extrair `FormModal` compartilhado | Spec futura / Onda 3 |
| RF-12 | Extrair `PagamentosModal` de `home/page.tsx` | Spec futura / Onda 3 |
| RF-13 | Página piloto (`salas`) com `FormModal` | Spec futura / Onda 3 |

Propagação para demais páginas CRUD, `useCrudList`, `EntityTable`: **fora de escopo** (ver about.md).

---

## Checklist de conclusão da feature

| CA (about.md) | Task |
|---------------|------|
| #1 Raiz sem lixo (PNG, Java, SQL ad-hoc, lock vazio) | T01, T03, T10 |
| #2 `docs/` organizado; `TEST_SUMMARY` removido | T04, T10 |
| #3 `.gitignore` impede `*.tsbuildinfo` | T02, T10 |
| #4 Flyway um arquivo/versão; fresh install OK | T06–T08, T10 |
| #5 `mvnw test`, `npm lint`, `npm build` verdes | T01, T07–T08, T10 |
| #6 README com scripts e pointers | T05, T09, T10 |

| RF | Task principal |
|----|----------------|
| RF-01 | T01 |
| RF-02 | T02 |
| RF-03 | T03 |
| RF-04 | T04 |
| RF-05 | T05 |
| RF-06 | T06 |
| RF-07 | T07 |
| RF-08 | T08 |
| RF-09 | T09 |
| RF-10 | T10 |
| RF-11–RF-13 | Deferidos (Onda 3) |

---

## Próximo passo

Implementar com **`/implementa o plano`** ou task a task (ex.: **executa T01**).

Após T10: **`spec-validator`** → `reviews/limpeza-otimizacao-arquivos-2026-07-30.md`.
