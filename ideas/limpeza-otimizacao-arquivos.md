# Limpeza e Otimização de Arquivos

**Status:** Spec aprovada — plano pronto — [about.md](../specs/limpeza-otimizacao-arquivos/about.md) · [plan.md](../specs/limpeza-otimizacao-arquivos/plan.md)  
**Data:** 2026-07-30  
**Tipo:** Inventário técnico + direção de otimização (idea-refine)

---

## Como Poderíamos…?

> **Como poderíamos reduzir ruído no repositório (artefatos, docs obsoletos, código órfão) e atacar redundância estrutural no frontend — sem apagar domínios incompletos que fazem parte do roadmap?**

O problema não é “ter muitos arquivos”, e sim **misturar código vivo, lixo acidental, documentação desatualizada e duplicação de padrões** — o que aumenta custo de manutenção, confunde novos contribuidores e mascara o que ainda falta implementar (Fiador, Caução, Configuração Locador).

---

## Problema

Após duas ondas grandes (usabilidade + security hardening), o repositório acumulou:

| Sintoma | Impacto |
|---------|---------|
| Arquivos na raiz sem propósito (`FileStorageService.java` vazio, `package-lock.json` vazio) | Confusão sobre o que é código vs. acidente |
| 6 screenshots PNG (~950 KB) na raiz | Poluição visual; duplicam artefatos Playwright |
| Docs de teste/revisão desatualizados (60 testes vs. 186 atuais) | Decisões baseadas em informação errada |
| Duas migrações `V2__*` conflitantes | **Risco em fresh install** com Flyway |
| Páginas CRUD de 350–790 linhas com padrões copiados | Bugfix/a11y exige N arquivos; drift entre páginas |
| Entidades/repos Java sem service/controller | Parecem “mortos”, mas são **features pendentes** |

**Pontos fortes a preservar:** specs/reviews concluídas, skill local `backend-security-hardening`, scripts SQL úteis para QA, `README.md` atualizado pós-hardening.

---

## Inventário por categoria

### 🔴 A — Remover imediato (lixo confirmado)

| Arquivo | Evidência | Ação |
|---------|-----------|------|
| `FileStorageService.java` (raiz) | 0 bytes; zero referências; upload real está em `ContratoDocumentoService` | **Deletar** |
| `ContratoRequestDTO.java` (raiz) | Duplicata acidental; versão canônica em `src/.../dto/` | **Deletar** (já staged como removido) |
| `package-lock.json` (raiz) | Lockfile vazio (`packages: {}`); frontend tem o próprio em `frontend/` | **Deletar** |
| `01-dashboard-vazio.png` … `06-mobile-modal.png` | Screenshots da revisão Playwright; conteúdo já em `REVISAO_USABILIDADE.md` + `reviews/` | **Deletar** ou mover para `docs/assets/revisao-2026-07/` |
| `frontend/tsconfig.tsbuildinfo` | Cache de compilação TypeScript | **Deletar** + adicionar ao `.gitignore` |

### 🟠 B — Consolidar / arquivar (docs redundantes ou desatualizados)

| Arquivo | Situação | Recomendação |
|---------|----------|--------------|
| `REVISAO_USABILIDADE.md` | Origem histórica; bugs corrigidos; spec + review existem | **Arquivar** em `docs/historico/` ou fundir sumário no README |
| `TEST_PLAN.md` | Plano inicial; cobertura real evoluiu muito | **Arquivar** ou substituir por seção “Testes” no README |
| `TEST_SUMMARY.md` | Diz **60 testes** (jun/2026); hoje são **186** | **Atualizar** ou **deletar** (CI + `mvnw test` são fonte de verdade) |
| `SECURITY_TESTS_SUMMARY.md` | Referência útil, mas parcialmente desatualizada | **Mover** para `docs/testes/seguranca.md` e revisar contagem |
| `AUTH_SETUP.md` | ~280 linhas; README já cobre env vars + fluxo JWT | **Fundir** trechos únicos no README; **deletar** ou arquivar |
| `USER_MANUAL_PRINTABLE.html` | Manual standalone | **Mover** para `docs/manual/` se ainda usado; senão arquivar |
| `HELP.md` | Default Spring Boot; já no `.gitignore` | Manter ignorado; não versionar |

### 🟡 C — Reorganizar (scripts ad-hoc úteis)

| Arquivo | Uso | Recomendação |
|---------|-----|--------------|
| `test-data.sql` | Seed manual para QA (locatário + contrato) | **Mover** para `scripts/dev/seed-test-data.sql` + 1 linha no README |
| `test-query.sql` | Query pontual de debug | **Mover** para `scripts/dev/` ou deletar se descartável |
| `check-db.sql` | Verificação rápida do banco | **Mover** para `scripts/dev/` |

### 🔴 D — Corrigir (não deletar — conflito Flyway)

| Arquivo | Problema | Recomendação |
|---------|----------|--------------|
| `V2__create_usuario_table.sql` | Tabela `usuario` **já existe** em `V1__init.sql` (linhas 539+) | **Remover** migration redundante |
| `V2__add_contrato_documento.sql` | Válida e necessária | **Renumerar** para `V6__...` se V2 for liberado, ou fundir lógica em migration única |

> ⚠️ Dois arquivos `V2__*` quebram fresh install com Flyway. Bancos existentes podem ter histórico inconsistente — exige plano de migration (ver riscos).

### 🟢 E — Manter (parecem mortos, mas são roadmap)

| Código | Estado real | Por que NÃO deletar |
|--------|-------------|---------------------|
| `Fiador`, `Caucao`, repos | Sem service/controller | Garantia XOR é regra crítica (`constituicao.mdc`) |
| `ConfiguracaoLocador` + repo | Sem API/UI | Singleton `id=1` necessário para contratos oficiais |
| `TerrenoDTO` | Zero imports | Candidato a **usar** (API response) ou remover na spec de Terrenos v2 |
| `TestController` | `@Profile("dev")` | Útil em dev; já protegido pós-hardening |
| `.cursor/skills/backend-security-hardening/` | Skill local do projeto | Documentação viva de decisões de segurança |

### 🔵 F — Redundância estrutural (otimização de código, não de arquivos)

Padrões repetidos em **5 páginas CRUD** + dashboard monolítico:

| Padrão duplicado | Onde aparece | Linhas aprox. |
|------------------|--------------|---------------|
| `erro` + `erroModal` + `ErrorAlert` | terrenos, salas, locatários, contratos, home | ~15–20/página |
| `useEscapeKey` + overlay modal | idem + AppHeader | idem |
| `SortableTh` + sort client-side | 4 listagens | ~40–60/página |
| `.table-scroll` + `<table>` | 5 páginas | markup repetido |
| `fetchJson` / `requestJson` + loading/error | todas CRUDs | boilerplate |
| Modal de pagamentos embutido | `home/page.tsx` alone | **789 linhas** |

**Componentes já extraídos (não duplicar esforço):** `SortableTh`, `useEscapeKey`, `AddressFields`, `useCepLookup`, `ErrorAlert`, `MaskedInput`.

**Oportunidades de extração (DRY):**

1. `FormModal` — overlay + escape + erro interno + footer ações
2. `useCrudList<T>` — fetch, sort, delete confirm, loading/error
3. `EntityTable` — table-scroll + SortableTh + row actions
4. Extrair `PagamentosModal` de `home/page.tsx` (~200 linhas)

---

## Alternativas consideradas

### Onda 1 — Higiene do repositório (baixo risco)

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Deletar lixo + atualizar `.gitignore`** | Rápido; zero impacto em runtime | Não resolve duplicação de código |
| B) Mover tudo para `docs/archive/` | Histórico preservado | Ainda ocupa espaço; menos limpo |
| C) Ignorar e focar só em código | Zero esforço imediato | Ruído acumula; onboarding pior |

**Escolha recomendada:** **A** para lixo confirmado; **B** para docs históricos (`REVISAO_USABILIDADE.md`, `AUTH_SETUP.md`).

### Onda 2 — Flyway e scripts dev

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Remover V2 usuario + renumerar contrato_documento** | Fresh install limpo | Bancos existentes precisam checagem |
| B) Squash de todas migrations em V1 novo | Schema único | Perde histórico; perigoso em prod |
| C) Desabilitar Flyway; só `ddl-auto=update` | “Funciona” localmente | Perde versionamento; proibido para prod |

**Escolha recomendada:** **A** com script de verificação `scripts/dev/check-flyway-history.sql`.

### Onda 3 — DRY no frontend (maior ROI de manutenção)

| Opção | Prós | Contras |
|-------|------|---------|
| **A) `FormModal` + `useCrudList` incremental** | Reduz ~30% linhas por página; padrão único de erro/a11y | Refatoração tocando 5+ arquivos |
| B) Rewrite com biblioteca (TanStack Table, etc.) | Features ricas | Dependência nova; curva de aprendizado |
| C) Manter copy-paste | Zero risco de regressão | Cada melhoria UX = 5 PRs |

**Escolha recomendada:** **A** — alinhado ao que a spec de usabilidade já adiou como “Onda 2” (`FormModal`).

### Onda 4 — Backend stubs

| Opção | Prós | Contras |
|-------|------|---------|
| A) Deletar `TerrenoDTO`, repos Fiador/Caucao | Repo “mais limpo” | Apaga preparação do domínio |
| **B) Marcar com `@Deprecated` + issue/spec** | Clareza sem perder modelo | Ainda ocupa espaço |
| **C) Implementar features (spec separada)** | Resolve gaps reais | Escopo grande; fora desta ideia |

**Escolha recomendada:** **C** via specs existentes (`mapeamento-features-sistema.md`); **deletar só** `TerrenoDTO` se confirmado que API retorna entidade direto.

---

## Escopo proposto

### Incluir (Onda 1 — quick wins, ~1–2h)

1. Deletar órfãos confirmados (categoria A).
2. Atualizar `.gitignore`: `*.tsbuildinfo`, `docs/assets/` se mover PNGs.
3. Criar `scripts/dev/` e mover SQLs ad-hoc (categoria C).
4. Arquivar docs desatualizados em `docs/historico/` ou fundir no README.
5. Atualizar `TEST_SUMMARY.md` com contagem real ou removê-lo.

### Incluir (Onda 2 — Flyway, ~2h, requer spec)

1. Auditar `flyway_schema_history` em ambientes existentes.
2. Remover `V2__create_usuario_table.sql`.
3. Renumerar `V2__add_contrato_documento.sql` → próxima versão livre.
4. Teste: `docker-compose up` + fresh DB + `mvnw test`.

### Incluir (Onda 3 — DRY frontend, spec separada)

1. Extrair `FormModal` com `erroModal`, escape, foco trap básico.
2. Extrair `PagamentosModal` de `home/page.tsx`.
3. Adotar `FormModal` em 1 página piloto (ex.: salas); depois propagar.

### Fora de escopo

- Deletar entidades/repos de domínio incompleto (Fiador, Caução, ConfigLocador).
- Suite de testes frontend (não existe ainda).
- Squash total de migrations.
- Layout cards mobile (spec usabilidade Onda 2+).

---

## Critérios de sucesso

1. Raiz do repo sem PNGs, `.java` soltos ou lockfiles vazios.
2. Documentação: uma fonte de verdade (`README.md` + `docs/`) — sem contagem de testes desatualizada.
3. Fresh install via Docker aplica Flyway sem conflito de versão.
4. `.\mvnw.cmd test` (186) e `npm run lint` + `npm run build` verdes após limpeza.
5. (Onda 3) Pelo menos 1 página CRUD usando `FormModal`; linhas de `home/page.tsx` reduzidas em ≥20%.

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Deletar migration que já rodou em prod | Checar `flyway_schema_history` antes; migration de repair se necessário |
| Arquivar doc ainda referenciado | Grep por links no README e specs antes de mover |
| Refatoração DRY quebra modais | Página piloto + lint/build; copiar padrão de locatários (referência madura) |
| Confundir stub de domínio com lixo | Manter lista “roadmap” no README ou `ideas/mapeamento-features-sistema.md` |

---

## Métricas atuais (baseline)

| Métrica | Valor |
|---------|-------|
| Arquivos lixo na raiz | 9 (6 PNG + 2 Java/lock + tsbuildinfo) |
| Docs MD na raiz | 7 (`README` + 6 auxiliares) |
| Testes backend | 186 (docs dizem 60) |
| Maior página frontend | `home/page.tsx` — 789 linhas |
| Páginas CRUD | 4 × 350–566 linhas |
| Migrações Flyway | 6 arquivos, **2 com versão V2** |
| Código Java sem uso (imports) | `TerrenoDTO`; repos Fiador/Caucao sem injeção |

---

## Próximo passo

1. Implementar Ondas 1–2 via [plan.md](../specs/limpeza-otimizacao-arquivos/plan.md) (**T01–T10**).
2. Onda 3 (FormModal, PagamentosModal) **deferida** — spec futura `frontend-crud-dry` ou aprovação explícita.
3. Após T10: **spec-validator** → `reviews/limpeza-otimizacao-arquivos-2026-07-30.md`.
