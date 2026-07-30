# Mapeamento de Features — Gestão de Aluguel

**Status:** Rascunho — aguardando validação humana  
**Data:** 2026-07-30  
**Tipo:** Inventário + direção estratégica (idea-refine)

---

## Como Poderíamos…?

> **Como poderíamos ter visibilidade clara do que já funciona, do que está incompleto e de qual sequência de entregas leva o sistema da holding do estado atual até operação diária confiável?**

O problema não é falta de código — é **desalinhamento entre o modelo de dados (ambicioso), a API (parcial) e o frontend (CRUDs básicos)**. Avançar sem esse mapa corre o risco de implementar telas sobre lacunas críticas (garantia XOR, cobranças automáticas, configuração do locador).

---

## Visão geral do estado atual

| Camada | Maturidade | Resumo |
|--------|------------|--------|
| **Banco (Flyway)** | Alta no desenho, média na execução | Schema rico em `V1__init.sql` (enums, constraints, triggers, views). Migrações posteriores simplificaram/evoluíram partes do modelo. |
| **Backend (Spring Boot)** | Média-alta | CRUDs principais + auth JWT + cobranças manuais + upload PDF + lembretes/backup agendados. Vários domínios só existem como entidade/repositório. |
| **Frontend (Next.js)** | Média | Auth completa; CRUD terrenos/salas/locatários/contratos; dashboard home com pagamentos. Lacunas grandes em garantias, locador, relatórios e campos PF/PJ. |
| **Testes** | Alta no backend | 23 classes de teste (controllers, services, security). Frontend sem testes automatizados. |
| **Spec-driven** | Inexistente | `specs/` e `ideas/` vazios até este documento. Nenhum plano em `.cursor/sdd/progress.md`. |

---

## Mapa por domínio

Legenda: ✅ implementado · 🟡 parcial · ❌ não implementado · 📦 só modelo/DB

### 1. Autenticação e usuários

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| Login JWT | ✅ `usuario` | ✅ `AuthController` | ✅ `/login` |
| Registro | ✅ | ✅ | ✅ `/register` |
| Esqueci senha / reset | ✅ tokens | ✅ + `EmailService` | ✅ `/forgot-password` |
| Proteção de rotas | — | ✅ `JwtFilter`, Security | ✅ `useAuthGuard` |
| Rate limit / sanitização | — | ✅ | — |
| Testes | — | ✅ (auth + security suite) | — |

**Gap:** multi-usuário/perfil de acesso não modelado (campo `created_by` existe mas RBAC não).

---

### 2. Configuração do locador (singleton)

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| Tabela + constraint `id=1` | ✅ | 📦 `ConfiguracaoLocador` + repo | ❌ |
| CRUD / seed inicial | — | ❌ controller/service | ❌ |

**Gap crítico para contratos oficiais:** dados da holding não são editáveis pela UI nem expostos via API.

---

### 3. Terrenos

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| CRUD | ✅ + CHECK tipo | ✅ `TerrenoController` | ✅ `/terrenos` |
| COMERCIAL vs RESIDENCIAL | ✅ constraints | ✅ `TerrenoService` | ✅ formulário condicional |
| Relax metragem salas (V5) | ✅ | ✅ | ✅ |
| CEP / endereço | ✅ | — | ✅ `AddressFields`, `useCepLookup` |
| Testes | — | ✅ | — |

**Estado:** feature **madura** — referência de completude.

---

### 4. Salas

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| CRUD | ✅ | ✅ `SalaController` | ✅ `/salas` |
| Status DISPONIVEL/LOCADA/MANUTENCAO | ✅ enum | ✅ sync via `ContratoService` | ✅ badge/listagem |
| Vínculo terreno | ✅ FK | ✅ | ✅ select terreno |
| Testes | — | ✅ | — |

**Estado:** feature **madura**.

---

### 5. Locatários

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| CRUD básico | ✅ | ✅ `LocatarioController` | ✅ `/locatarios` |
| PF: identidade, data nascimento | ✅ CHECK | ✅ entidade | ❌ form não envia |
| PJ: IE, contato responsável | ✅ CHECK | ✅ entidade | ❌ form não envia |
| Documentos JSONB | ✅ | 📦 | ❌ |
| Ordenação / busca | — | — | 🟡 `SortableTh` |

**Gap crítico:** criar locatário PF pela UI **provavelmente falha** no banco (campos obrigatórios ausentes). TODO explícito no SQL (`V1` linha 135).

---

### 6. Fiador e Caução (garantia XOR)

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| Tabelas `fiador`, `caucao` | ✅ | 📦 entidades + repos | ❌ |
| Constraint XOR no contrato | ✅ `garantia_xor` | 🟡 DTO aceita `fiadorId`/`caucaoId` | ❌ UI não coleta |
| CRUD fiador/caução | — | ❌ | ❌ |
| Mensagem erro XOR | — | ✅ handler | 🟡 `errors.ts` traduz |

**Gap crítico:** fluxo principal de locação (README passo 2) **não é completável pela UI** sem bypass manual na API/DB.

---

### 7. Contratos

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| CRUD | ✅ | ✅ `ContratoController` | ✅ `/contratos` |
| Overlap de sala | — | ✅ service | — |
| Campos água/luz/IPTU/outras (V3) | ✅ | ✅ | ✅ form |
| Upload PDF | ✅ `contrato_documento` | ✅ `ContratoDocumentoController` | 🟡 upload no save |
| Garantia fiador/caução | ✅ XOR | 🟡 DTO only | ❌ |
| Situação EM_DIA/ATRASO | — | ✅ `ContratoService.enrichContrato` | ✅ home |
| Sync status sala | — | ✅ | — |
| Aditivos contratuais | ✅ tabela `aditivo` | ❌ | ❌ |
| Testes | — | ✅ controller + service | — |

**Estado:** núcleo funcional, mas **bloqueado pela garantia** e sem renovação/aditivo.

---

### 8. Cobranças / financeiro

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| Modelo simplificado (ano/mês/valor) | 🟡 V4 recria tabela | ✅ `Cobranca` JPA | ✅ modal na `/home` |
| Trigger auto-geração (V1) | 🟡 conflito com V4 | ❌ cobrança sob demanda | — |
| Trigger inadimplência (V1) | 🟡 | 🟡 lógica no `ContratoService` | 🟡 badges |
| CRUD cobranças | ✅ | ✅ `CobrancaController` | 🟡 só via home |
| Views `vw_vencimentos_dia`, `vw_relatorio_mensal` | ✅ | ❌ endpoints | ❌ |
| Lembretes e-mail mensais | — | ✅ `PagamentoReminderService` | ❌ config UI |
| IPTU/condomínio/agua/luz por parcela | ✅ no V1 | ❌ no modelo atual | ❌ |

**Dívida técnica:** `V1__init.sql` define cobrança rica + triggers; `V4__create_cobranca_table.sql` define schema **diferente** (provável falha em DB limpo ou drift). Duas migrações `V2__*` também exigem revisão Flyway.

---

### 9. Relatórios e dashboard

| Item | Banco | Backend | Frontend |
|------|-------|---------|----------|
| Dashboard resumo | — | 🟡 agrega listas | ✅ `/home` cards + tabela |
| Contratos em atraso | — | ✅ `situacao` | ✅ alerta |
| Relatório mensal | ✅ view | ❌ | ❌ |
| Vencimentos do dia | ✅ view | ❌ | ❌ |
| Export CSV/PDF | — | ❌ | ❌ |

---

### 10. Infra / operação

| Item | Backend | Observação |
|------|---------|------------|
| Backup DB agendado | ✅ `DatabaseBackupService` | Envia por e-mail |
| E-mail transacional | ✅ `EmailService` | Reset senha + lembretes |
| Test controller / seed | ✅ `/api/test` | Dev only |
| Global exception handler | ✅ | Mensagens PT-BR |

---

## Matriz de cobertura (resumo visual)

```
Domínio              DB    API   UI    Testes
─────────────────────────────────────────────
Auth                 ✅    ✅    ✅    ✅
Config locador       ✅    ❌    ❌    —
Terrenos             ✅    ✅    ✅    ✅
Salas                ✅    ✅    ✅    ✅
Locatários           ✅    ✅    🟡    ✅
Fiador / Caução      ✅    ❌    ❌    —
Contratos            ✅    ✅    🟡    ✅
Documento PDF        ✅    ✅    🟡    —
Aditivos             ✅    ❌    ❌    —
Cobranças            🟡    ✅    🟡    ✅
Relatórios           ✅    ❌    ❌    —
Lembretes e-mail     —     ✅    ❌    ✅
Backup               —     ✅    ❌    —
```

---

## Problemas transversais identificados

1. **Garantia XOR** — regra de negócio central no banco; UI e APIs de fiador/caução inexistentes.
2. **Locatário incompleto na UI** — desalinhamento com constraints PF/PJ.
3. **Drift de migrações** — V1 vs V4 (cobrança), dois arquivos V2; README descreve triggers que o código JPA pode não usar.
4. **Frontend monolítico em `/home`** — ~860 linhas com pagamentos embutidos; duplicação de variáveis (`contratosAtivos`, `salasDisponiveis`) e possível referência a `mesPermitidoParaAno` não definida (risco de build).
5. **Zero specs** — nenhuma feature oficial documentada para validar "pronto".
6. **Sem testes frontend** — gate manual (lint + build).

---

## Fase 2 — Alternativas de avanço (divergente)

### Opção A — "Operação mínima viável"
Foco: conseguir cadastrar locação completa ponta a ponta.

- Corrigir form locatário (PF/PJ)
- API + UI fiador **ou** caução (escolher um fluxo primeiro)
- Vincular garantia no form de contrato
- Revisar migrações cobrança (uma fonte de verdade)

**Prós:** desbloqueia uso real rápido. **Contras:** relatórios e locador ficam para depois.

### Opção B — "Consolidar fundação"
Foco: alinhar DB ↔ backend ↔ frontend antes de features novas.

- Audit Flyway (merge V2, resolver V1/V4 cobrança)
- Decidir: triggers automáticos **ou** geração no service (documentar)
- Extrair módulo cobranças do home
- Config locador (API + tela settings)

**Prós:** menos dívida, menos bugs silenciosos. **Contras:** demora valor visível ao usuário.

### Opção C — "Financeiro primeiro"
Foco: holding precisa cobrar e enxergar inadimplência.

- Endpoints sobre views SQL existentes
- Tela relatório mensal + vencimentos
- Cobrança com breakdown (condomínio, IPTU)
- Dashboard enxuto

**Prós:** valor financeiro imediato. **Contras:** contratos ainda quebrados sem garantia.

### Opção D — "Spec-driven completo"
Foco: processo antes de código.

- Spec por epic (locação, financeiro, config, relatórios)
- Plans atômicos + TDD
- Validator antes de PR

**Prós:** sustentável longo prazo. **Contras:** overhead inicial.

---

## Fase 3 — Convergência recomendada

**Hipótese:** a holding precisa **operar locações** antes de relatórios avançados.

### Roadmap sugerido (4 ondas)

| Onda | Objetivo | Entregáveis principais |
|------|----------|------------------------|
| **0 — Fundação** | DB confiável | Revisão Flyway; decisão modelo cobrança; fix build home |
| **1 — Locação completa** | Fluxo README passo 1–2 funcional | Locatário PF/PJ; fiador **ou** caução; contrato com garantia |
| **2 — Financeiro diário** | Cobrar e acompanhar | Cobranças (página dedicada ou refator home); situação contrato; lembretes configuráveis |
| **3 — Gestão holding** | Config + relatórios | Config locador; views mensal/vencimentos; aditivos/renovação |

### Prioridade imediata (se aprovar)

1. **Spec `locacao-completa`** — cobre locatário + garantia + contrato (Opção A + pedaço de B).
2. **Task técnica 0** — audit migrations antes de implementar cobrança automática.
3. **Quick win** — campos PF/PJ no form locatário (provável bug em produção).

---

## Perguntas para validação

Responda para fechar este rascunho e avançar para `spec-writer`:

1. **Qual opção (A/B/C/D) ou mix** reflete melhor a urgência da holding?
2. **Garantia preferida na UI:** fiador, caução, ou wizard "escolha um"?
3. **Cobranças:** manter registro manual (estado atual) ou reativar geração automática ao criar contrato?
4. **Config locador:** necessário na onda 1 ou pode esperar?
5. **Relatórios:** quais são indispensáveis (mensal, inadimplência, por terreno)?

---

## Critério de saída desta ideia

- [ ] Humano validou mapa e prioridades
- [ ] Decisão sobre drift de migrações
- [ ] Status atualizado para **"Aprovada para spec"**
- [ ] Próximo passo: `spec-writer` → `specs/locacao-completa/about.md` (ou epic escolhido)

---

## Referências no repositório

- Schema: `src/main/resources/db/migration/V1__init.sql`
- README fluxos: `README.md` § Fluxos Principais
- Navegação UI: `frontend/app/components/AppHeader.tsx`
- Regras workspace: `.cursor/rules/constituicao.mdc`
