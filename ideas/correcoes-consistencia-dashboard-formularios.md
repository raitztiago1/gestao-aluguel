# Correções de Consistência — Dashboard, Terrenos e Salas

**Status:** Aprovada para spec  
**Data:** 2026-07-30  
**Origem:** Uso manual pós-implementação (descoberta de 3 inconsistências de comportamento)

---

## Como Poderíamos…?

> **Como poderíamos alinhar o que o usuário vê na tela inicial e nos formulários de cadastro com o estado real do sistema — situação de pagamento, campos de terreno por tipo e status de sala — sem duplicar regras de negócio no frontend?**

---

## Problema

Três achados independentes, todos de **fidelidade entre backend e UI**:

| # | Área | Sintoma | Impacto |
|---|------|---------|---------|
| 1 | Dashboard — coluna **Situação** | Contrato com pagamentos em dia aparece **"Em aberto"** | Usuário não confia no painel; alerta de atraso inútil |
| 2 | Modal **Novo terreno** | Trocar RESIDENCIAL ↔ COMERCIAL mantém campos do tipo anterior | Submit pode falhar na validação backend ou gravar dados incoerentes |
| 3 | Modal **Sala** + dashboard | Create permite escolher status manualmente; home não reflete status real | Cadastro confuso; salas em manutenção/locadas invisíveis ou mal representadas |

---

## Achado 1 — Situação de pagamento na tela inicial

### Comportamento esperado (usuário)

| Estado do pagamento | Coluna **Situação** | Box **"Contratos em atraso"** |
|---------------------|---------------------|-------------------------------|
| Meses devidos pagos | **Pago** | Oculto |
| Não pago, antes do vencimento | Em aberto | Oculto |
| Não pago, após vencimento | Em atraso | Visível, com lista |

### Comportamento atual

- Backend **calcula corretamente** `situacao` (`EM_DIA` / `EM_ABERTO` / `EM_ATRASO`) em `ContratoService.resolveSituacao()`.
- Campo é `@Transient` com **`@JsonIgnore`** em `Contrato.java` — **nunca chega ao frontend**.
- Frontend faz fallback: `contrato.situacao || 'EM_ABERTO'` → **sempre "Em aberto"** para contratos ativos.
- Box **"Contratos em atraso"** renderiza **sempre**, mesmo com 0 contratos.
- Label atual para em dia é **"Em dia"**; usuário prefere **"Pago"**.

### Arquivos envolvidos

- `src/main/java/.../domain/model/Contrato.java` — `@JsonIgnore` em `situacao` e `emDia`
- `src/main/java/.../service/ContratoService.java` — lógica correta (testada)
- `frontend/app/home/page.tsx` — `getSituacaoContrato`, `contratosEmAtraso`, alert card
- `frontend/app/lib/labels.ts` — labels de badge (opcional)

### Alternativas

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Remover `@JsonIgnore` de `situacao`** | Fix mínimo; lógica permanece no backend | Expõe campo derivado na entidade REST |
| B) `ContratoResponseDTO` com `situacao` | Separação limpa API/entidade | Mais arquivos; controller já usa DTO só no POST |
| C) Calcular situação no frontend | Sem mudança backend | Duplica regra de negócio; proibido pela constituição |

**Recomendação:** **A** — remover `@JsonIgnore` apenas de `situacao` (campo já é `@Transient`, não persiste). Opcional expor `emDia` se simplificar frontend.

**UI complementar:**
- Mapear `EM_DIA` → label **"Pago"** (não "Em dia").
- Renderizar alerta `{contratosEmAtraso.length > 0 && (...)}`.
- Contratos **não ATIVO**: exibir **"—"** ou ocultar situação de pagamento (hoje mostra "Em aberto" enganosamente).

---

## Achado 2 — Troca de tipo no modal de terreno

### Comportamento esperado (usuário)

Ao mudar **RESIDENCIAL → COMERCIAL** (ou vice-versa), **limpar apenas os campos exclusivos do tipo anterior**, preservando endereço, metragem total e observações.

### Comportamento atual

- Handler do `<select>` de tipo atualiza **somente** `tipo`.
- Campos específicos permanecem em memória:
  - COMERCIAL: `vagasGaragem`, `quantidadeSalas`
  - RESIDENCIAL: `metragemCasa`
- `formatTerrenoPayload()` envia campos preenchidos mesmo ocultos.
- `TerrenoService.validateTerreno()` **rejeita** payload com campos do tipo errado.

### Arquivos envolvidos

- `frontend/app/terrenos/page.tsx` — `formTerreno`, handler de `tipo`, `formatTerrenoPayload`
- `src/main/java/.../service/TerrenoService.java` — validação por tipo

### Alternativas

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Reset completo ao trocar tipo** (`defaultTerrenoForm` + novo `tipo`) | Atende pedido literal; zero resíduo | Perde endereço já preenchido se usuário errou o tipo |
| B) Limpar **só campos específicos** do tipo anterior | Preserva endereço e metragem total | Não atende "todos os campos" literalmente |
| C) Limpar específicos + `metragemTotal` + `observacoes`, manter endereço | Balanceado | Requer decisão explícita do usuário |

**Decisão aprovada:** **B — reset parcial.** Ao trocar tipo, zerar somente:

| Tipo de origem | Campos limpos |
|----------------|---------------|
| COMERCIAL | `vagasGaragem`, `quantidadeSalas` |
| RESIDENCIAL | `metragemCasa` |

**Preservados:** endereço (CEP, logradouro, número, complemento, bairro, cidade, estado), `metragemTotal`, `observacoes`.

**Edição de terreno existente:** mesma regra ao trocar tipo no modal de edição.

---

## Achado 3 — Status de sala (create / edit / home)

### Comportamento esperado (usuário)

| Contexto | Status |
|----------|--------|
| **Cadastro** (nova sala) | Sempre **Disponível** — sem campo de status no modal |
| **Edição** | Toggle **Em manutenção** ↔ **Disponível**; status **Locada** read-only quando houver contrato |
| **Tela inicial** | Card **Salas disponíveis** (como hoje) + card **Em manutenção** condicional |

### Comportamento atual

- Create e edit usam o **mesmo** `<select>` com 3 opções: Disponível, Locada, Em manutenção.
- Backend `SalaService.syncStatus()`:
  - `MANUTENCAO` → preservado (único status verdadeiramente manual).
  - `DISPONIVEL` / `LOCADA` → **recalculados** a partir de contratos ativos; escolha manual é ignorada.
- Home (`home/page.tsx`):
  - Card e modal listam **apenas** salas `DISPONIVEL`.
  - Sem coluna de status; salas locadas e em manutenção **invisíveis** no dashboard.

### Regras de negócio implícitas (já no backend)

- **Locada** = derivado de contrato ativo (não deve ser editável manualmente).
- **Em manutenção** = flag manual; sala excluída do picker de contratos.
- **Disponível** = default + estado quando sem contrato e sem manutenção.

### Alternativas — modal

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Create: sem campo; Edit: toggle/checkbox "Em manutenção"** | Alinha com regras reais; UX clara | Precisa tratar transição MANUTENCAO → DISPONIVEL |
| B) Edit: select só Disponível / Em manutenção | Simples | "Disponível" em sala locada será sobrescrito pelo sync — precisa aviso ou campo read-only |
| C) Manter select com 3 opções | Zero mudança | Continua enganoso |

**Decisão aprovada — modal:** Create envia `status: 'DISPONIVEL'` fixo (sem campo no formulário). Edit exibe status atual como badge read-only + checkbox **"Em manutenção"** que permite **marcar e desmarcar** (MANUTENCAO ↔ DISPONIVEL). Se status for **Locada** (contrato ativo), checkbox desabilitado com explicação.

### Home — decisão aprovada

- Manter card **"Salas disponíveis"** (contagem + modal filtrado por `DISPONIVEL`).
- Adicionar card **"Salas em manutenção"** — renderizado **somente** quando `salas.filter(s => s.status === 'MANUTENCAO').length > 0`.
- Card de manutenção: contagem + modal listando salas em manutenção (Sala, Metragem, Terreno).
- Salas **locadas** continuam fora do dashboard (derivadas de contrato; visíveis na listagem `/salas`).

---

## Escopo proposto para spec

**Incluir (Onda única — correções pontuais):**

1. **Dashboard situação** — expor `situacao` na API; labels Pago/Em aberto/Em atraso; alerta condicional; situação neutra para contratos inativos.
2. **Terreno tipo** — reset parcial ao trocar tipo (só campos exclusivos do tipo anterior).
3. **Sala status** — create sem seletor; edit com toggle manutenção ↔ disponível; card condicional de manutenção na home.

**Fora de escopo:**

- Refatorar `ContratoResponseDTO` completo (só se opção B for escolhida).
- Recalcular situação no frontend.
- Layout cards no mobile para salas.
- Alterar lógica de `syncStatus` no backend (já correta).

---

## Critérios de sucesso

1. Contrato ativo com todos os meses devidos pagos → coluna Situação mostra **"Pago"** (badge verde).
2. Contrato ativo com parcela pendente antes do vencimento → **"Em aberto"**; box de atraso **oculto**.
3. Contrato ativo inadimplente → **"Em atraso"**; box visível com contrato listado.
4. Trocar tipo de terreno no modal → nenhum campo residual do tipo anterior no submit.
5. Nova sala → cadastrada como Disponível sem opção de status no formulário.
6. Editar sala → pode marcar **e desmarcar** manutenção (volta a Disponível); Locada read-only quando houver contrato.
7. Home → card "Salas em manutenção" **só aparece** se existir ≥1 sala em manutenção; card "Salas disponíveis" permanece como hoje.
8. `.\mvnw.cmd test` e `npm run lint` verdes; teste de integração ou unitário para `situacao` no JSON de contratos.

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Expor `situacao` na entidade REST confunde consumidores | Documentar como campo derivado; só leitura |
| Usuário desmarca manutenção com contrato ativo na sala | Backend `syncStatus` recalcula para LOCADA; UI desabilita toggle quando locada |

---

## Decisões aprovadas (2026-07-30)

1. **Terreno:** reset **parcial** — limpar só campos exclusivos do tipo (`vagasGaragem`, `quantidadeSalas` ou `metragemCasa`); preservar endereço e campos compartilhados.
2. **Sala edit:** permitir **marcar e desmarcar** manutenção (MANUTENCAO ↔ DISPONIVEL).
3. **Home salas:** card separado **"Em manutenção"**, condicional (oculto se zero); card **"Salas disponíveis"** mantido.

---

## Próximo passo

→ **`spec-planner`** — `specs/correcoes-consistencia-dashboard-formularios/plan.md` (após aprovação do [about.md](../specs/correcoes-consistencia-dashboard-formularios/about.md))
