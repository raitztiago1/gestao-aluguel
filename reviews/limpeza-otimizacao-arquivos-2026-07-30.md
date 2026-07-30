# Spec Compliance — limpeza-otimizacao-arquivos

**Data:** 2026-07-30  
**Spec:** [specs/limpeza-otimizacao-arquivos/about.md](../specs/limpeza-otimizacao-arquivos/about.md)  
**Plano:** [specs/limpeza-otimizacao-arquivos/plan.md](../specs/limpeza-otimizacao-arquivos/plan.md)  
**Escopo validado:** Ondas 1–2 (Onda 3 deferida)

---

## Resumo executivo

| Resultado | Detalhe |
|-----------|---------|
| **Ondas 1–2** | Implementadas |
| **Backend** | `.\mvnw.cmd test` — **186 testes, BUILD SUCCESS** |
| **Frontend** | `npm run lint` e `npm run build` — **verdes** (warnings pré-existentes) |
| **Docker fresh install (RF-10)** | **Não executado** — `docker` ausente no PATH deste ambiente |
| **Audit Flyway live (RF-06)** | **Parcial** — `psql`/`docker` indisponíveis; decisão documentada abaixo |

---

## Checklist de RFs (Ondas 1–2)

| RF | Status | Evidência |
|----|--------|-----------|
| RF-01 Remover órfãos raiz | ✅ | Deletados: `FileStorageService.java`, `package-lock.json` (raiz), 6 PNGs, SQLs raiz. `ContratoRequestDTO.java` na raiz não existia. Stub Fiador/Caucao/ConfigLocador preservados. |
| RF-02 `.gitignore` tsbuildinfo | ✅ | `*.tsbuildinfo` adicionado; `git status` não lista cache após build |
| RF-03 Scripts `scripts/dev/` | ✅ | `seed-test-data.sql`, `test-query.sql`, `check-db.sql` movidos; raiz sem `*.sql` |
| RF-04 Consolidar docs | ✅ | `docs/historico/`, `docs/testes/seguranca.md`, `docs/manual/`; `TEST_SUMMARY.md` deletado; links em specs/ideas corrigidos |
| RF-05 README operacional | ✅ | Seções Testes, Scripts, Documentação, roadmap stub, fluxo auth |
| RF-06 Audit Flyway | ⚠️ | Sem query live (sem `docker`/`psql`). Análise estática + script T09 documentam repair para DBs existentes |
| RF-07 Remover V2 usuario | ✅ | `V2__create_usuario_table.sql` deletado; `usuario` permanece em V1 |
| RF-08 Renumerar V6 contrato_documento | ✅ | `V2__add_contrato_documento.sql` → `V6__add_contrato_documento.sql`; ordem V1→V3→V4→V5→V6 |
| RF-09 Script check-flyway | ✅ | `scripts/dev/check-flyway-history.sql` + README |
| RF-10 Fresh install Docker | ⚠️ | Bloqueado — Docker CLI não instalado/disponível neste ambiente |

### Onda 3 (deferida)

| RF | Status |
|----|--------|
| RF-11 FormModal | ⏸ Deferido |
| RF-12 PagamentosModal | ⏸ Deferido |
| RF-13 Piloto salas | ⏸ Deferido |

---

## Critérios de aceite globais (#1–#6)

| # | Critério | Status |
|---|----------|--------|
| 1 | Raiz sem lixo (PNG, Java, SQL, lock vazio) | ✅ |
| 2 | `docs/` organizado; `TEST_SUMMARY` removido; `docs/testes/seguranca.md` | ✅ |
| 3 | `.gitignore` impede `*.tsbuildinfo` | ✅ |
| 4 | Flyway um arquivo/versão; fresh install OK | ⚠️ Arquivos OK; fresh install Docker pendente validação manual |
| 5 | mvnw test, npm lint, npm build verdes | ✅ |
| 6 | README com scripts e pointers | ✅ |

---

## Flyway — audit e repair (T06)

### Estado do repositório (pós T07/T08)

```text
db/migration/
  V1__init.sql
  V3__contrato_datas_cobranca_outras_despesas.sql
  V4__create_cobranca_table.sql
  V5__relax_terreno_comercial_metragem_salas.sql
  V6__add_contrato_documento.sql
```

V2 ausente intencionalmente (gap 2→3 aceito para fresh install).

### Bancos existentes (pré-merge)

Se `flyway_schema_history` contiver entradas das migrations antigas:

1. **`V2 create usuario table`** (redundante, removida):  
   `DELETE FROM flyway_schema_history WHERE version = '2' AND description ILIKE '%usuario%';`

2. **`V2 add contrato documento`** (renumerada para V6):  
   `UPDATE flyway_schema_history SET version = '6' WHERE version = '2' AND description ILIKE '%contrato documento%';`

Instruções também em `scripts/dev/check-flyway-history.sql`.

### Bloqueio de validação live

- `docker` — comando não encontrado no PATH (Windows)
- `psql` — comando não encontrado no PATH
- Testes Maven conectaram a PostgreSQL local (`localhost:5432`) com sucesso — indica DB local ativo, mas histórico Flyway não foi consultado diretamente

**Ação recomendada:** executar RF-10 manualmente:

```powershell
docker compose down -v
docker compose up --build -d
Get-Content scripts/dev/check-flyway-history.sql | docker exec -i gestao-aluguel-db psql -U postgres -d gestao_aluguel
```

---

## Alterações por task

| Task | Ação principal |
|------|----------------|
| T01 | Deletados 9 arquivos órfãos na raiz + frontend cache (se existisse) |
| T02 | `.gitignore` + `*.tsbuildinfo` |
| T03 | `scripts/dev/` com 3 SQLs renomeados/movidos |
| T04 | Docs para `docs/`; `TEST_SUMMARY` deletado; links specs corrigidos |
| T05 | README expandido (testes, scripts, docs, auth, roadmap) |
| T06 | Audit documentado neste review (sem query live) |
| T07 | `V2__create_usuario_table.sql` removido |
| T08 | `V6__add_contrato_documento.sql` criado; V2 contrato removido |
| T09 | `check-flyway-history.sql` |
| T10 | Gates mvnw/lint/build OK; Docker pendente |

### Extra (habilitar gate lint)

- Adicionado `frontend/.eslintrc.json` (`extends: next/core-web-vitals`) — projeto tinha `eslint-config-next` sem config; `npm run lint` falhava em prompt interativo

---

## Verificação executada

```text
.\mvnw.cmd test          → Tests run: 186, Failures: 0, BUILD SUCCESS
cd frontend; npm run lint → exit 0 (2 warnings)
cd frontend; npm run build → exit 0
Raiz .png/.java/.sql      → nenhum arquivo
Migrations V2__*.sql      → nenhum
```

---

## Gaps / próximos passos

1. **RF-10:** validar fresh install Docker quando CLI disponível
2. **RF-06 live:** rodar `check-flyway-history.sql` em ambiente com `psql` ou Docker; aplicar repair se necessário
3. **Onda 3:** aguardar aprovação explícita (FormModal, PagamentosModal)

---

## Conclusão

**Ondas 1–2 implementadas com compliance alta.** Único gap bloqueante para DoD completo de RF-10/RNF-03: validação Docker fresh install no ambiente do operador (ferramentas indisponíveis na sessão de implementação).
