# Spec Compliance — Usabilidade pós-Revisão Playwright

**Data:** 2026-07-30  
**Spec:** [specs/usabilidade-pos-revisao/about.md](../specs/usabilidade-pos-revisao/about.md)  
**Plano:** [specs/usabilidade-pos-revisao/plan.md](../specs/usabilidade-pos-revisao/plan.md)  
**Veredito:** ✅ **Aprovado para PR** (com ressalvas menores documentadas)

---

## Evidências de verificação

| Comando | Resultado |
|---------|-----------|
| `.\mvnw.cmd test` | ✅ 186 testes, 0 falhas |
| `cd frontend; npm run build` | ✅ Build OK |
| `rg "/crud" frontend/app` | ✅ Zero matches |

---

## Checklist de Requisitos Funcionais

| RF | Descrição | Status | Evidência |
|----|-----------|--------|-----------|
| RF-01 | jsonb `documentos` Locatário/Fiador | ✅ | `@JdbcTypeCode(SqlTypes.JSON)` em `Locatario.java`, `Fiador.java`; testes `LocatarioServiceTest.createSavesLocatarioWithDocumentosJson`, `LocatarioControllerTest.createReturnsLocatarioWithDocumentosJson` |
| RF-02 | Contrato via DTO sem `emDia` | ✅ | `ContratoRequestDTO` + `ContratoController`; `ContratoRequestDTOTest.deserializesPayloadWithoutEmDiaField`; `ContratoServiceTest.createSavesContratoWithFiadorId` |
| RF-03 | Erros dentro do modal | ✅ | `erroModal` + `ErrorAlert` em terrenos, salas, locatários, contratos; pagamentos usa `erro` dentro de `.modal-content` em `home/page.tsx` |
| RF-04 | Mensagens humanizadas | ✅ | `lib/errors.ts`; `mensagemAdicionarPagamento` distingue contrato futuro |
| RF-05 | Remover `/crud` | ✅ | Página removida; nenhum link residual |
| RF-06 | Filtrar salas no contrato | ✅ | `contratos/page.tsx` — `salasDisponiveis` filtra `DISPONIVEL` (+ sala em edição) |
| RF-07 | A11y labels + aria-sort | ✅ | `htmlFor`/`aria-required` em CRUDs, login, registro, `AddressFields`; `SortableTh` com `aria-sort`; labels opcionais do contrato corrigidos nesta sessão |
| RF-08 | Escape fecha modal | ✅ | `useEscapeKey` em terrenos, salas, locatários, contratos, home, `AppHeader` |
| RF-09 | Mobile sem overflow documento | ✅ | `globals.css` `overflow-x: hidden`; `.table-scroll` em listagens; menu hambúrguer |
| RF-10 | Decimais área (2 casas) | ✅ | `formatArea`, `formatAreaInput`; usado em terrenos/salas |
| RF-11 | Favicon | ✅ | `frontend/app/favicon.ico`; metadata em `layout.tsx` |
| RF-12 | Métrica "Salas disponíveis" | ✅ | Label e contagem em `home/page.tsx` |

---

## Critérios de aceite globais

| # | Critério | Status | Notas |
|---|----------|--------|-------|
| 1 | Locatário + contrato caução pela UI | ✅* | Backend/testes verdes; smoke manual recomendado antes do merge |
| 2 | CPF inválido visível no modal | ✅ | `setErroModal` em `locatarios/page.tsx` |
| 3 | 100% labels formulários principais | ✅ | Exceto `forgot-password` (fora de escopo) |
| 4 | Mobile 390px sem overflow | ✅* | CSS/layout implementado; smoke DevTools recomendado |
| 5 | `mvnw test` verde | ✅ | 186 testes |
| 6 | Contrato com fiador | ✅ | `ContratoServiceTest.createSavesContratoWithFiadorId` + jsonb Fiador |

\* Smoke manual end-to-end não executado nesta sessão (sem Docker/UI rodando).

---

## Tasks do plano

| Task | Status |
|------|--------|
| T01 | ✅ |
| T02 | ✅ |
| T03 | ✅ |
| T04 | ✅ |
| T05 | ✅ |
| T06 | ✅ |
| T07 | ✅ |
| T08 | ✅ |
| T09 | ✅ |

---

## Correções aplicadas nesta implementação

- Testes backend: documentos jsonb, DTO contrato sem `emDia`, fiadorId
- Labels `htmlFor` nos campos opcionais do formulário de contrato
- Fix build: duplicata `salasDisponiveis`/`contratosAtivos` em `home/page.tsx`
- Fix build: `mesPermitidoParaAno` → `periodoPermitido`

---

## Ressalvas (não bloqueantes)

1. **Smoke manual UI** — checklist de 6 itens do about.md deve ser executado com backend+frontend rodando antes do merge em produção.
2. **`forgot-password`** — labels a11y fora de escopo Onda 1.
3. **Destaque por campo inválido** — fora de escopo Onda 2.

---

## Conclusão

Implementação **cumpre a spec Onda 1**. Recomenda-se smoke manual rápido (login → locatário → contrato → pagamento) e merge.
