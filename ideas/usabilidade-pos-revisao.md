# Melhorias de Usabilidade pós-Revisão Playwright

**Status:** Aprovada para spec — `specs/usabilidade-pos-revisao/about.md`  
**Data:** 2026-07-30  
**Origem:** `REVISAO_USABILIDADE.md` (teste E2E Playwright, 06/07/2026)

---

## Como Poderíamos…?

> **Como poderíamos tornar o fluxo núcleo (Locatário → Contrato → Cobranças) utilizável pela UI e elevar a experiência geral — erros visíveis, acessibilidade, mobile — sem regressão nos módulos que já funcionam bem?**

---

## Problema

A revisão E2E identificou que **dois bugs de backend bloqueavam o fluxo principal** e uma série de achados de UX/a11y/responsividade degradavam a confiança do usuário:

| Área | Impacto |
|------|---------|
| Locatário/Fiador `documentos` jsonb | CRUD de locatários retorna 500 — fluxo morto |
| Contrato `emDia` primitivo | POST de contrato retorna 400 — fluxo morto |
| Erros atrás do modal | Usuário não vê validação (ex.: CPF inválido) |
| Página `/crud` órfã | Interface duplicada, confusa, sem nav |
| A11y (0/11 labels) | Leitores de tela não anunciam campos |
| Mobile overflow | Tabelas ~865px em viewport 390px |

**Pontos fortes a preservar:** Terrenos, Salas, Pagamentos, autenticação, autofill CEP, confirmações de exclusão.

---

## Alternativas consideradas

### P0 — Desbloquear backend

| Opção | Prós | Contras |
|-------|------|---------|
| **A) `@JdbcTypeCode(JSON)` + DTO de contrato** | Correção mínima, alinhada à revisão | Requer testes de integração |
| B) Migrar coluna `documentos` para `text` | Simples no SQL | Perde semântica jsonb; migration |
| C) `@JsonIgnore` em `emDia` | Rápido | Campo derivado continua exposto em outros fluxos |

**Escolha:** **A** — type handler jsonb + `ContratoRequestDTO` (não expor entidade no `@RequestBody`).

### P1 — Erros no modal

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Estado `erroModal` separado de `erro` de página** | Padrão já usado em Pagamentos/Locatários | Repetir em cada página CRUD |
| B) Componente `FormModal` compartilhado | DRY | Escopo maior; refatoração |

**Escolha:** **A** na Onda 1 (paridade rápida); **B** como melhoria futura opcional.

### P2 — Acessibilidade

| Opção | Prós | Contras |
|-------|------|---------|
| **A) `<label htmlFor>` + `aria-required` incremental por página** | Baixo risco, entrega contínua | Não resolve tudo de uma vez |
| B) Audit axe-core automatizado no CI | Regressão detectada | Setup extra |

**Escolha:** **A** agora; **B** na spec se aprovado.

### P3 — Mobile

| Opção | Prós | Contras |
|-------|------|---------|
| **A) `.table-scroll` + menu hambúrguer** | Baixo esforço, resolve overflow | Tabelas ainda exigem scroll horizontal |
| B) Layout cards no mobile | UX superior | Refatoração maior por entidade |

**Escolha:** **A** na Onda 1; **B** fora de escopo inicial.

---

## Inventário de implementação (working tree)

### ✅ Já endereçado (parcial ou total)

| Item revisão | Evidência |
|--------------|-----------|
| BUG-1 jsonb Locatário/Fiador | `@JdbcTypeCode(SqlTypes.JSON)` em ambos |
| BUG-2 Contrato emDia | `ContratoRequestDTO` + controller usa payload |
| Remover `/crud` | `frontend/app/crud/page.tsx` removido |
| Erros dentro do modal | `erroModal` em locatários, contratos, home/pagamentos |
| Filtrar salas MANUTENCAO | `contratos/page.tsx` filtra `DISPONIVEL` |
| Escape fecha modal | `useEscapeKey` em locatários, contratos, home, AppHeader |
| Mensagem pagamento contrato futuro | `mensagemAdicionarPagamento` com texto específico |
| Acentuação mensagens | "até", "já" corrigidos |
| Métrica "Salas disponíveis" | Label explícito no dashboard |
| Decimais área (exibição) | `formatArea` com 2 casas; `formatAreaInput` criado |
| Labels + aria-required | locatários, contratos, AddressFields |
| aria-sort | componente `SortableTh` (locatários, contratos) |
| Scroll horizontal tabelas | `.table-scroll` + CSS; home, locatários, contratos |
| Menu mobile | `AppHeader` com toggle hambúrguer |
| Mensagens de erro API | `lib/errors.ts` humaniza DB/HTTP |
| Favicon | `frontend/app/favicon.ico` + metadata em layout |

### 🔶 Pendente / parcial

| Item | Gap |
|------|-----|
| Destaque de campo com erro | Revisão pede highlight; só mensagem genérica hoje |
| Contraste badges | Não auditado; baixa prioridade |
| Forgot-password — a11y | Inputs sem `<label htmlFor>` (fora do escopo imediato) |

### ✅ Concluído nesta sessão (paridade Terrenos/Salas/Auth)

| Item | Evidência |
|------|-----------|
| Terrenos e Salas — paridade UX | `erroModal`, `useEscapeKey`, `htmlFor`, `table-scroll`, `SortableTh` |
| Decimais em edição | `formatAreaInput` em `terrenoToForm` e `editarSala` |
| Login / Registro — a11y | `<label htmlFor>` + `aria-required` nos campos principais |

---

## Escopo proposto para spec (Onda 1)

**Incluir:**

1. **P0** — Validar backend (testes Locatário + Contrato passando; smoke manual CRUD).
2. **P1** — Paridade modal/erro em Terrenos e Salas; remover qualquer link residual a `/crud`.
3. **P2** — Completar a11y: labels em Terrenos, Salas, Login, Registro; `SortableTh` onde ainda há botões inline.
4. **P3** — `formatAreaInput` na edição; `table-scroll` em Terrenos/Salas; favicon verificado no build.

**Fora de escopo (Onda 2+):**

- Layout cards no mobile (substituir tabelas).
- Componente `FormModal` unificado.
- Audit axe no CI.
- Destaque visual por campo inválido (requer mapeamento field→erro no backend).

---

## Critérios de sucesso

1. Cadastrar locatário PF e contrato com caução **pela UI** sem 500/400.
2. Erro de validação (CPF inválido) **visível dentro do modal** em todas as páginas CRUD.
3. Nenhum input de formulário principal sem label associado (meta: 100% nas 5 entidades + auth).
4. Viewport 390px: sem overflow de documento (scroll só dentro de `.table-scroll`).
5. `npm run lint` e `.\mvnw.cmd test` verdes.

---

## Riscos

- **Regressão em Terrenos/Salas** ao alinhar padrão de modal — mitigar copiando padrão de locatários.
- **Fiador no contrato** — mesmo fix jsonb; testar contrato com fiador após P0.
- **Review desatualizada** — parte já implementada; spec deve partir deste inventário, não reimplementar.

---

## Próximo passo

→ **`spec-planner`** — `specs/usabilidade-pos-revisao/plan.md` (após aprovação do about.md)
