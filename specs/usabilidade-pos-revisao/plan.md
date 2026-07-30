# Plano — Melhorias de Usabilidade pós-Revisão Playwright

**Spec:** [about.md](about.md) (aprovada 2026-07-30)  
**Status plano:** Concluído (2026-07-30)

**Nota:** grande parte do código já existe no working tree (ver *Baseline* no about.md). As tasks abaixo priorizam **validação, testes de regressão e fechamento de gaps** — não reimplementação do zero.

---

## Ordem de execução

```text
T01 (jsonb backend) → T02 (ContratoRequestDTO)
                   → T03 (erroModal CRUDs) → T04 (errors.ts + /crud + salas)
                   → T05 (a11y labels) → T06 (Escape + SortableTh)
                   → T07 (mobile + CSS) → T08 (decimais + favicon + dashboard)
                   → T09 (smoke manual + spec-validator)
```

T01–T02 desbloqueiam o fluxo núcleo. T03–T04 corrigem UX de erro. T05–T08 polimento a11y/mobile. T09 fecha a feature.

---

## T01 — RF-01: Persistência jsonb (Locatário e Fiador)

| Campo | Valor |
|-------|-------|
| **RFs** | RF-01 |
| **Arquivos** | `Locatario.java`, `Fiador.java`, opcional: teste integração/MockMvc |
| **Estimativa** | ~60 min |

### Ações

1. Confirmar `@JdbcTypeCode(SqlTypes.JSON)` + `@Column(columnDefinition = "jsonb")` em `Locatario` e `Fiador`.
2. Se ausente, aplicar anotação conforme revisão ([revisao-usabilidade-2026-07.md](../../docs/historico/revisao-usabilidade-2026-07.md) BUG-1).
3. Adicionar teste que exercite persistência com campo `documentos` não-nulo (MockMvc `@SpringBootTest` ou `@DataJpaTest` com H2/Postgres testcontainer — preferir MockMvc se já houver padrão no projeto).
4. Smoke: `POST /api/locatarios` com JWT válido retorna **201**, não **500**.

### Critério de aceite

- Nenhum SQLState `42804` em create/update de locatário.
- Contrato com fiador contendo `documentos` persiste sem 500.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=LocatarioControllerTest,LocatarioServiceTest" test
.\mvnw.cmd test
```

---

## T02 — RF-02: Contrato via DTO (sem bind de `emDia`)

| Campo | Valor |
|-------|-------|
| **RFs** | RF-02, RN-01 |
| **Arquivos** | `ContratoRequestDTO.java`, `ContratoController.java`, `ContratoService.java`, `ContratoControllerTest.java`, `ContratoServiceTest.java` |
| **Depende de** | — |
| **Estimativa** | ~60 min |

### Ações

1. Confirmar `ContratoController.create/update` recebe `ContratoRequestDTO.ContratoPayload`, não entidade `Contrato`.
2. Confirmar payload **sem** campo `emDia` deserializa e persiste.
3. Garantir testes cobrem create/update com DTO mínimo (sala, locatário, datas, valor, caução **ou** fiador).
4. Remover `ContratoRequestDTO.java` órfão na raiz do repo se ainda existir.

### Critério de aceite

- **CA global #1 e #6:** POST contrato com caução → 201; POST com fiador → 201.

### Verificação

```powershell
.\mvnw.cmd "-Dtest=ContratoControllerTest,ContratoServiceTest" test
```

---

## T03 — RF-03: Erros visíveis dentro do modal

| Campo | Valor |
|-------|-------|
| **RFs** | RF-03 |
| **Arquivos** | `terrenos/page.tsx`, `salas/page.tsx`, `locatarios/page.tsx`, `contratos/page.tsx`, `home/page.tsx` |
| **Depende de** | T01–T02 (para erros de API reais) |
| **Estimativa** | ~45 min |

### Ações

1. Em cada página CRUD com modal, confirmar estado `erroModal` separado de `erro` de página.
2. `ErrorAlert` como primeiro filho de `.modal-content` (antes do `<form>`).
3. Handlers de submit e validação client-side (ex.: CPF via `useCepLookup` / máscara) devem chamar `setErroModal`, não `setErro`, quando modal aberto.
4. Modal de pagamentos em `home/page.tsx`: erro dentro do overlay.

### Critério de aceite

- **CA global #2:** CPF inválido em locatário → alerta legível com modal aberto.
- Erro de API ao salvar terreno/sala/contrato → visível no modal.

### Verificação

```powershell
cd frontend; npm run build
```

Smoke manual: item 2 do checklist do about.md.

---

## T04 — RF-04, RF-05, RF-06: Mensagens, `/crud`, filtro de salas

| Campo | Valor |
|-------|-------|
| **RFs** | RF-04, RF-05, RF-06, RF-12 |
| **Arquivos** | `lib/errors.ts`, `contratos/page.tsx`, `home/page.tsx`, remover `crud/page.tsx` se existir |
| **Depende de** | T02 |
| **Estimativa** | ~45 min |

### Ações

1. **`errors.ts`:** confirmar mapeamentos para constraints DB e mensagens 4xx/5xx em português.
2. **`home/page.tsx`:** `mensagemAdicionarPagamento` distingue contrato futuro vs. “todos pagamentos registrados”; acentuação correta.
3. **RF-05:** confirmar ausência de `frontend/app/crud/`; grep por `/crud` no frontend → zero matches.
4. **RF-06:** em `contratos/page.tsx`, filtrar salas: criação só `DISPONIVEL`; edição inclui sala atual.
5. **RF-12:** card dashboard rotulado “Salas disponíveis”.

### Critério de aceite

- **CA-04, CA-05, CA-06** do about (mensagens, /crud, salas).

### Verificação

```powershell
cd frontend; npm run build
# grep manual: rg "/crud" frontend/app
```

Smoke manual: itens 3–4 do checklist.

---

## T05 — RF-07: Acessibilidade de formulários

| Campo | Valor |
|-------|-------|
| **RFs** | RF-07 |
| **Arquivos** | `terrenos/page.tsx`, `salas/page.tsx`, `locatarios/page.tsx`, `contratos/page.tsx`, `home/page.tsx`, `login/page.tsx`, `register/page.tsx`, `AddressFields.tsx` |
| **Estimativa** | ~60 min |

### Ações

1. Auditar cada `<input>`, `<select>`, `<textarea>`: `<label htmlFor="id">` + `id` correspondente.
2. Campos `required` → `aria-required="true"`.
3. Asterisco decorativo → `<span className='required-star' aria-hidden='true'>*</span>`.
4. `AddressFields`: prefixo de id por instância (já existente — validar).
5. Documentar contagem: meta 100% nos formulários principais (fora de escopo: `forgot-password`).

### Critério de aceite

- **CA global #3:** nenhum input principal sem label associado.

### Verificação

```powershell
cd frontend; npm run build
```

Inspeção manual DevTools → Accessibility tree em 1 formulário por página.

---

## T06 — RF-07 (sort), RF-08: `SortableTh` e Escape

| Campo | Valor |
|-------|-------|
| **RFs** | RF-07 (aria-sort), RF-08 |
| **Arquivos** | `SortableTh.tsx`, páginas CRUD, `AppHeader.tsx`, `hooks/useEscapeKey.ts` |
| **Depende de** | T05 |
| **Estimativa** | ~30 min |

### Ações

1. Substituir botões inline de ordenação por `SortableTh` onde ainda existirem (terrenos, salas — se não migrados).
2. Confirmar `useEscapeKey(resetForm, showModal)` em todos os modais de formulário.
3. Confirmar `useEscapeKey` nos modais de resumo do dashboard e menu mobile.

### Critério de aceite

- Cabeçalhos ordenáveis expõem `aria-sort`.
- Escape fecha modal aberto (smoke item 6).

### Verificação

Smoke manual + inspeção de `SortableTh` em 5 listagens.

---

## T07 — RF-09: Responsividade mobile

| Campo | Valor |
|-------|-------|
| **RFs** | RF-09 |
| **Arquivos** | `globals.css`, `AppHeader.tsx`, `home/page.tsx`, páginas CRUD (wrappers `.table-scroll`) |
| **Estimativa** | ~45 min |

### Ações

1. Confirmar `overflow-x: hidden` no container/body.
2. Confirmar `.table-scroll` envolvendo `<table>` em: home, terrenos, salas, locatários, contratos.
3. Confirmar menu hambúrguer em `AppHeader` com `aria-expanded` / `aria-controls`.
4. Testar viewport 390px: `document.documentElement.scrollWidth <= window.innerWidth`.

### Critério de aceite

- **CA global #4:** sem overflow horizontal do documento.

### Verificação

Smoke manual item 5; DevTools responsive 390×844.

---

## T08 — RF-10, RF-11: Decimais, favicon, polimento

| Campo | Valor |
|-------|-------|
| **RFs** | RF-10, RF-11 |
| **Arquivos** | `lib/format.ts`, `terrenos/page.tsx`, `salas/page.tsx`, `app/favicon.ico`, `layout.tsx` |
| **Estimativa** | ~30 min |

### Ações

1. `formatAreaInput` usado em `terrenoToForm` e `editarSala` (não `String(n).replace('.', ',')`).
2. Exibição em tabelas via `formatArea` (2 casas decimais).
3. `favicon.ico` presente; `layout.tsx` metadata `icons.icon: '/favicon.ico'`.
4. Build de produção serve favicon sem 404.

### Critério de aceite

- Editar terreno 850,50 → reabrir formulário mostra `850,50`.
- Network tab: `/favicon.ico` → 200.

### Verificação

```powershell
cd frontend; npm run build
```

---

## T09 — Validação final e spec-validator

| Campo | Valor |
|-------|-------|
| **RFs** | Todos; RNF-01–RNF-05 |
| **Arquivos** | `reviews/usabilidade-pos-revisao-2026-07-30.md`, `.cursor/sdd/progress.md` |
| **Depende de** | T01–T08 |
| **Estimativa** | ~60 min |

### Ações

1. Executar suite backend completa.
2. `npm run build` no frontend (lint se configurado).
3. Checklist smoke manual completo (6 itens do about.md).
4. Rodar **spec-validator** → relatório em `reviews/usabilidade-pos-revisao-2026-07-30.md`.
5. Atualizar status do about.md e progress.md.

### Critério de aceite

- Todos os **CA globais #1–#6** com evidência documentada.
- `reviews/...md` sem gaps bloqueantes.

### Verificação

```powershell
.\mvnw.cmd test
cd frontend; npm run build
```

---

## Checklist de conclusão da feature

| CA (about.md) | Task |
|---------------|------|
| #1 Locatário + contrato caução pela UI | T01, T02, T09 |
| #2 Erro dentro do modal | T03, T09 |
| #3 Labels 100% | T05, T09 |
| #4 Mobile sem overflow | T07, T09 |
| #5 Testes Maven verdes | T01, T02, T09 |
| #6 Contrato com fiador | T01, T02, T09 |

| RF | Task principal |
|----|----------------|
| RF-01 | T01 |
| RF-02 | T02 |
| RF-03 | T03 |
| RF-04, RF-12 | T04 |
| RF-05, RF-06 | T04 |
| RF-07 | T05, T06 |
| RF-08 | T06 |
| RF-09 | T07 |
| RF-10, RF-11 | T08 |

---

## Próximo passo

Implementar com **`/implementa o plano`** ou task a task (ex.: **executa T01**).

Após T09: **`spec-validator`** → `reviews/usabilidade-pos-revisao-2026-07-30.md`.
