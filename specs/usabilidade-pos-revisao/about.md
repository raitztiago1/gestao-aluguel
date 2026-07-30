# Melhorias de Usabilidade pós-Revisão Playwright

## Metadados

| Campo | Valor |
|-------|-------|
| **Feature slug** | `usabilidade-pos-revisao` |
| **Status** | **Aprovada** (2026-07-30) |
| **Data** | 2026-07-30 |
| **Origem** | [ideas/usabilidade-pos-revisao.md](../../ideas/usabilidade-pos-revisao.md) ← [REVISAO_USABILIDADE.md](../../REVISAO_USABILIDADE.md) |
| **Stack** | Java 25, Spring Boot 4, JPA/Hibernate 6, Next.js 14 (App Router), React 18, TypeScript 5 |
| **Impacto** | Backend (Locatário, Fiador, Contrato) + frontend (CRUDs, dashboard, auth, layout) |

---

## Contexto

Em 06/07/2026 foi executada uma revisão end-to-end com Playwright cobrindo autenticação, CRUD de entidades, dashboard, pagamentos, responsividade mobile e acessibilidade. O teste identificou **dois bugs críticos de backend** que tornavam o fluxo núcleo (Locatário → Contrato → Cobranças) inutilizável pela interface, além de achados de UX, a11y e mobile.

**Estado atual do repositório (pré-spec):** parte substancial dos itens P0–P3 já foi implementada no working tree (ver seção *Baseline de implementação*). Esta spec define o **estado-alvo oficial** e os critérios de aceite para validação — não reimplementação cega.

**Pontos fortes a preservar:** Terrenos, Salas, fluxo de Pagamentos, autenticação, autofill de CEP, confirmações de exclusão bem escritas.

---

## Objetivo

Restaurar o fluxo núcleo do sistema pela UI e elevar usabilidade, acessibilidade e responsividade mobile a um nível consistente em todas as páginas CRUD — **sem regressão** nos módulos que já funcionam bem.

---

## Escopo

### Dentro do escopo (Onda 1)

| Prioridade | Itens |
|------------|-------|
| **P0** | Corrigir e validar bugs backend: `documentos` jsonb (Locatário, Fiador); contrato via DTO (sem bind de `emDia` primitivo) |
| **P1** | Erros visíveis dentro de modais; mensagens de erro humanizadas; remover página `/crud`; filtrar salas indisponíveis no formulário de contrato |
| **P2** | Labels associados (`htmlFor`), `aria-required`, `aria-sort` em cabeçalhos ordenáveis; fechar modais com tecla Escape |
| **P3** | Scroll horizontal de tabelas no mobile; menu hambúrguer; decimais padronizados (2 casas) em área; mensagens com acentuação correta; favicon sem 404 |

### Fora do escopo (Onda 2+)

- Layout em cards no mobile (substituir tabelas).
- Componente `FormModal` compartilhado (refatoração DRY).
- Audit axe-core automatizado no CI.
- Destaque visual por campo inválido (requer mapeamento field→erro no backend).
- Audit de contraste WCAG em badges de status.
- Labels em `forgot-password` (mencionado na ideia como baixa prioridade).

---

## Personas e fluxos afetados

| Persona | Fluxo | Impacto esperado |
|---------|-------|------------------|
| Operador imobiliário | Cadastrar locatário PF → criar contrato com caução → registrar pagamento | Fluxo completo pela UI, sem 500/400 |
| Operador imobiliário | Editar terreno/sala/locatário com erro de validação | Mensagem visível **dentro do modal** |
| Operador mobile | Navegar listagens em viewport 390px | Sem overflow horizontal do documento; scroll só nas tabelas |
| Usuário com leitor de tela | Preencher formulários CRUD e auth | Campos anunciados com nome; obrigatórios com `aria-required` |
| Operador | Selecionar sala ao criar contrato | Apenas salas `DISPONIVEL` (exceto sala já vinculada em edição) |

---

## Baseline de implementação (working tree)

Itens já endereçados antes da execução formal do plano — a validação deve confirmar, não reescrever:

| ID revisão | Estado | Evidência esperada |
|------------|--------|-------------------|
| BUG-1 jsonb | Implementado | `@JdbcTypeCode(SqlTypes.JSON)` em `Locatario.java`, `Fiador.java` |
| BUG-2 emDia | Implementado | `ContratoRequestDTO` + `ContratoController` usa payload, não entidade |
| `/crud` órfã | Implementado | `frontend/app/crud/page.tsx` removido; nenhum link residual |
| Erros no modal | Implementado | `erroModal` em locatários, contratos, terrenos, salas, pagamentos |
| Salas MANUTENCAO | Implementado | Filtro em `contratos/page.tsx` |
| Escape / a11y / mobile | Implementado | `useEscapeKey`, `SortableTh`, `.table-scroll`, menu hambúrguer em `AppHeader` |
| Decimais / favicon / mensagens | Implementado | `formatAreaInput`, `favicon.ico`, textos corrigidos no dashboard |

---

## Requisitos Funcionais

### RF-01 — Persistência de `documentos` jsonb (Locatário e Fiador)

**Descrição:** Campos `documentos` mapeados para coluna PostgreSQL `jsonb` devem persistir sem erro de tipo.

**Comportamento:**
- `POST /api/locatarios` e `PUT /api/locatarios/{id}` retornam **2xx** com payload válido.
- Mesmo comportamento quando contrato inclui fiador com campo `documentos`.
- Hibernate usa type handler JSON (`@JdbcTypeCode(SqlTypes.JSON)`).

**Critério de aceite:** Nenhum HTTP 500 com SQLState `42804` (type mismatch jsonb/varchar) em create/update de locatário.

---

### RF-02 — Criação e edição de contrato via DTO

**Descrição:** Controller de contrato não recebe entidade JPA diretamente no `@RequestBody`.

**Comportamento:**
- `POST /api/contratos` e `PUT /api/contratos/{id}` aceitam `ContratoRequestDTO.ContratoPayload`.
- Campo derivado `emDia` **não** é exigido no JSON de entrada.
- Serviço mapeia DTO → entidade; `emDia` permanece responsabilidade do domínio/triggers.

**Critério de aceite:** Payload mínimo válido (sala, locatário, datas, valor, garantia XOR) retorna **201/200** — não **400** por `emDia` null.

---

### RF-03 — Erros de formulário visíveis dentro do modal

**Descrição:** Falhas de validação client-side ou resposta de erro da API durante submit de modal devem aparecer **no overlay**, não atrás dele.

**Comportamento:**
- Estado `erroModal` (ou equivalente) separado de `erro` de página.
- Componente `ErrorAlert` renderizado como primeiro filho de `.modal-content` antes do `<form>`.
- Aplica-se a: Terrenos, Salas, Locatários, Contratos, modal de Pagamentos.

**Critério de aceite:** CPF inválido em locatário exibe alerta legível com modal aberto (evidência: screenshot equivalente a `02-locatario-cpf-invalido.png`, porém com erro visível).

---

### RF-04 — Mensagens de erro humanizadas

**Descrição:** Respostas de erro da API são traduzidas para português claro via `lib/errors.ts`.

**Comportamento:**
- Erros HTTP 4xx/5xx exibem mensagem contextual (não apenas "Ocorreu um erro inesperado").
- Constraints de banco conhecidas (`valida_locatario`, `garantia_xor`, FK, unique) mapeadas para texto amigável.
- Mensagens de pagamento para contrato com início futuro explicam que o contrato ainda não iniciou.

**Critério de aceite:** Contrato futuro sem cobranças exibe texto com acentuação correta ("até", "já") e sem afirmar falsamente que pagamentos já foram registrados.

---

### RF-05 — Remoção da página `/crud`

**Descrição:** Interface duplicada de terrenos acessível só por URL direta deve ser eliminada.

**Comportamento:**
- Rota `/crud` retorna 404 no Next.js.
- Nenhum link interno aponta para `/crud`.

---

### RF-06 — Filtro de salas no formulário de contrato

**Descrição:** Select de sala lista apenas salas utilizáveis.

**Comportamento:**
- Em criação: apenas salas com `status === 'DISPONIVEL'`.
- Em edição: salas `DISPONIVEL` **ou** a sala já vinculada ao contrato em edição.
- Salas `MANUTENCAO` e `LOCADA` (de outro contrato) não aparecem.

---

### RF-07 — Acessibilidade de formulários

**Descrição:** Inputs de formulários principais possuem nome acessível.

**Comportamento:**
- Todo `<input>`, `<select>`, `<textarea>` em páginas CRUD e auth (login, registro) tem `<label htmlFor="...">` correspondente.
- Campos obrigatórios incluem `aria-required="true"`.
- Asterisco visual usa `aria-hidden="true"` no span decorativo.
- Cabeçalhos de tabela ordenáveis usam `aria-sort` (`ascending` / `descending` / `none`).

**Páginas in scope:** `/terrenos`, `/salas`, `/locatarios`, `/contratos`, `/home` (modal pagamentos), `/login`, `/register`, componente `AddressFields`.

---

### RF-08 — Fechar modal com tecla Escape

**Descrição:** Modais de formulário e resumo fecham ao pressionar `Escape`.

**Comportamento:**
- Hook `useEscapeKey(callback, enabled)` registrado quando modal está aberto.
- Menu mobile do header também fecha com Escape.

---

### RF-09 — Responsividade mobile das listagens

**Descrição:** Viewport estreito (390px) não força scroll horizontal no documento.

**Comportamento:**
- `body`/container principal com `overflow-x: hidden`.
- Tabelas envolvidas em `.table-scroll` com `overflow-x: auto`.
- Navegação principal colapsa em menu hambúrguer (`AppHeader`).

**Critério de aceite:** `document.documentElement.scrollWidth <= window.innerWidth` em listagens principais (home, terrenos, salas, locatários, contratos) em 390px.

---

### RF-10 — Formatação decimal de área

**Descrição:** Metragem exibida e editada com 2 casas decimais no padrão pt-BR.

**Comportamento:**
- Exibição: `formatArea` → ex. `850,50 m²`.
- Edição: `formatAreaInput` ao popular formulário de terreno/sala.
- Entrada via `MaskedInput` com máscara `area`.

---

### RF-11 — Favicon

**Descrição:** Ícone do site carrega sem 404.

**Comportamento:**
- Arquivo `frontend/app/favicon.ico` presente.
- `layout.tsx` referencia `/favicon.ico` em metadata.

---

### RF-12 — Métrica do dashboard clara

**Descrição:** Card de salas no painel deixa explícito que conta apenas disponíveis.

**Comportamento:**
- Rótulo: **"Salas disponíveis"** (não ambíguo).
- Contagem: `salas.filter(s => s.status === 'DISPONIVEL').length`.

---

## Regras de Negócio (referência — não alteradas por esta feature)

| RN | Descrição |
|----|-----------|
| RN-01 | Contrato exige **Fiador XOR Caução** — nunca ambos, nunca nenhum |
| RN-02 | Terreno COMERCIAL vs RESIDENCIAL com validações distintas |
| RN-03 | Locatário PF/PJ com campos obrigatórios distintos |
| RN-04 | Status de sala sincronizado com ocupação de contrato |

Esta feature **não altera** essas regras; apenas garante que a UI e a API permitam operá-las.

---

## Requisitos Não Funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Suite backend `.\mvnw.cmd test` verde após mudanças |
| RNF-02 | Frontend: `npm run lint` sem erros (quando ESLint configurado) |
| RNF-03 | Nenhuma regressão nos fluxos Terrenos, Salas e Pagamentos validados na revisão |
| RNF-04 | Idioma da UI: português (Brasil) |
| RNF-05 | Compatibilidade com consumo JWT Bearer existente — sem mudança de contrato auth |

---

## Critérios de aceite globais (Definition of Done)

1. ✅ Cadastrar locatário PF e contrato com caução **pela UI** sem HTTP 500/400.
2. ✅ Erro de validação (CPF inválido) **visível dentro do modal** em todas as páginas CRUD com modal.
3. ✅ 100% dos inputs em formulários principais (5 entidades + login + registro) com label associado.
4. ✅ Viewport 390px: sem overflow horizontal do documento; scroll confinado a `.table-scroll`.
5. ✅ `.\mvnw.cmd test` verde; verificação manual documentada no review de compliance.
6. ✅ Contrato com fiador (campo `documentos` jsonb) criável sem 500.

---

## Verificação

### Backend

```powershell
# Suite completa
.\mvnw.cmd test

# Foco contrato + locatário
.\mvnw.cmd "-Dtest=ContratoControllerTest,ContratoServiceTest,LocatarioControllerTest,LocatarioServiceTest" test
```

### Frontend

```powershell
cd frontend; npm run lint
cd frontend; npm run build
```

### Smoke manual (obrigatório pós-implementação)

1. Login → cadastrar locatário PF com CPF válido → **sucesso**.
2. Submeter locatário com CPF inválido → erro **dentro do modal**.
3. Criar contrato (sala disponível + caução) → **sucesso**; dashboard exibe cobranças.
4. Tentar contrato com sala em manutenção → sala **não listada** no select.
5. Viewport 390px em `/locatarios` → sem scroll horizontal da página.
6. Pressionar Escape com modal aberto → modal fecha.

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Regressão em Terrenos/Salas ao padronizar modal | Média | Copiar padrão de `locatarios/page.tsx`; smoke manual |
| Fiador quebrado por jsonb não testado | Média | RF-01 + smoke contrato com fiador |
| Spec desatualizada vs código já implementado | Alta | Baseline + spec-validator contra inventário |
| ESLint não configurado bloqueia gate | Média | `npm run build` como fallback; configurar ESLint se necessário |

---

## Métricas de sucesso (pós-implementação)

| Métrica | Antes (revisão) | Meta |
|---------|-----------------|------|
| CRUD Locatário pela UI | ❌ 500 | ✅ 2xx |
| CRUD Contrato pela UI | ❌ 400 | ✅ 2xx |
| Inputs com label (formulários principais) | 0/11 | 100% |
| Overflow horizontal mobile | Sim (~910px) | Não |
| Página `/crud` | Existe | Removida |

---

## Referências

- [REVISAO_USABILIDADE.md](../../REVISAO_USABILIDADE.md) — relatório original Playwright
- [ideas/usabilidade-pos-revisao.md](../../ideas/usabilidade-pos-revisao.md) — ideia aprovada
- Screenshots de evidência: `01-dashboard-vazio.png` … `06-mobile-modal.png` (raiz do projeto)

---

## Aprovação

| Revisor | Data | Status |
|---------|------|--------|
| Usuário | 2026-07-30 | Aprovada |

**Plano:** [plan.md](plan.md) — pronto para implementação
