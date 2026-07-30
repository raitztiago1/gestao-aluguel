# Correções de Consistência — Dashboard, Terrenos e Salas

## Metadados

| Campo | Valor |
|-------|-------|
| **Feature slug** | `correcoes-consistencia-dashboard-formularios` |
| **Status** | **Aprovada — implementada** (2026-07-30) |
| **Data** | 2026-07-30 |
| **Origem** | [ideas/correcoes-consistencia-dashboard-formularios.md](../../ideas/correcoes-consistencia-dashboard-formularios.md) |
| **Stack** | Java 25, Spring Boot 4, JPA/Hibernate, Next.js 14 (App Router), React 18, TypeScript 5 |
| **Impacto** | Backend (`Contrato.java`, testes) + frontend (`home/page.tsx`, `terrenos/page.tsx`, `salas/page.tsx`) |

---

## Contexto

Durante uso manual pós-implementação das melhorias de usabilidade, foram identificados **três defeitos de fidelidade entre backend e UI** — o sistema calcula ou valida corretamente no servidor, mas a interface não reflete o estado real (ou permite entrada inconsistente).

| # | Sintoma | Causa raiz conhecida |
|---|---------|----------------------|
| 1 | Contrato com pagamentos em dia aparece **"Em aberto"** na coluna Situação | `Contrato.situacao` é `@Transient` com `@JsonIgnore` — nunca serializado na API |
| 2 | Trocar tipo RESIDENCIAL ↔ COMERCIAL no modal de terreno mantém campos do tipo anterior | Handler do `<select>` atualiza só `tipo`; payload envia campos ocultos |
| 3 | Modal de sala permite escolher status manualmente no create; home não mostra salas em manutenção | UI não distingue create/edit; dashboard filtra só `DISPONIVEL` |

**Decisões de produto já aprovadas (2026-07-30):**

1. Terreno: **reset parcial** — limpar só campos exclusivos do tipo anterior; preservar endereço e campos compartilhados.
2. Sala edit: permitir **marcar e desmarcar** manutenção (MANUTENCAO ↔ DISPONIVEL).
3. Home: card **"Salas em manutenção"** condicional (oculto se zero); card **"Salas disponíveis"** mantido.

---

## Objetivo

Alinhar o que o usuário vê na tela inicial e nos formulários de cadastro com o estado real do sistema — situação de pagamento, campos de terreno por tipo e status de sala — **sem duplicar regras de negócio no frontend**.

---

## Escopo

### Dentro do escopo

| Bloco | Itens |
|-------|-------|
| **Dashboard — pagamentos** | Expor `situacao` na API; labels corretos; alerta de atraso condicional |
| **Terrenos — modal** | Reset parcial de campos ao trocar tipo (create e edit) |
| **Salas — modal** | Create sem seletor de status; edit com toggle manutenção |
| **Dashboard — salas** | Card condicional "Salas em manutenção" com modal de detalhes |
| **Testes** | Assert de `situacao` no JSON de contratos |

### Fora do escopo

- Refatorar `ContratoResponseDTO` completo (alternativa descartada na ideia).
- Calcular situação de pagamento no frontend.
- Alterar lógica de `ContratoService.resolveSituacao()` ou `SalaService.syncStatus()` (já corretas).
- Card ou listagem de salas **locadas** no dashboard.
- Layout cards no mobile; refatoração de componentes compartilhados.

---

## Personas e fluxos afetados

| Persona | Fluxo | Impacto esperado |
|---------|-------|------------------|
| Operador imobiliário | Consultar painel inicial / vencimentos | Situação de pagamento confiável; alerta de atraso só quando relevante |
| Operador imobiliário | Cadastrar terreno trocando tipo mid-form | Submit sem erro de validação por campos residuais |
| Operador imobiliário | Cadastrar nova sala | Sempre Disponível, sem confusão de status manual |
| Operador imobiliário | Colocar sala em manutenção / liberar | Toggle claro; locada bloqueada quando houver contrato |
| Operador imobiliário | Ver salas em manutenção no painel | Card aparece só quando existir ≥1 sala em manutenção |

---

## Baseline (estado atual — defeitos confirmados)

| Área | Arquivo | Comportamento atual |
|------|---------|---------------------|
| API contratos | `Contrato.java` L105–111 | `situacao` e `emDia` com `@JsonIgnore` |
| Dashboard situação | `home/page.tsx` L430–444 | Fallback `contrato.situacao \|\| 'EM_ABERTO'` → sempre "Em aberto" |
| Alerta atraso | `home/page.tsx` L789–800 | Renderizado **sempre**, inclusive com 0 contratos |
| Terreno tipo | `terrenos/page.tsx` L300 | `onChange` só altera `tipo` |
| Sala create/edit | `salas/page.tsx` L301–312 | `<select>` com 3 opções em ambos os modos |
| Home salas | `home/page.tsx` L481–485, L457 | Só conta/lista `DISPONIVEL`; sem card de manutenção |

---

## Requisitos Funcionais

### RF-01 — Expor `situacao` na resposta de contratos

**Descrição:** Campo derivado `situacao` calculado por `ContratoService.enrichContrato()` deve estar presente no JSON de `GET /api/contratos` e `GET /api/contratos/{id}`.

**Comportamento:**
- Remover `@JsonIgnore` de `Contrato.situacao` (campo permanece `@Transient` — não persiste, não aceita input).
- Manter `@JsonIgnore` em `emDia` (frontend usa `situacao` como fonte de verdade).
- Valores possíveis: `EM_DIA`, `EM_ABERTO`, `EM_ATRASO`.
- Lógica de cálculo **inalterada** em `ContratoService.resolveSituacao()`.

**Critério de aceite:**
- Teste (unitário ou MockMvc) confirma que contrato enriquecido serializa `"situacao":"EM_DIA"` (ou equivalente) no JSON.
- `POST`/`PUT` de contrato **não** exigem nem persistem `situacao` no body.

---

### RF-02 — Coluna Situação fiel na tabela de vencimentos

**Descrição:** Coluna **Situação** da seção "Vencimentos dos aluguéis" reflete o valor de `contrato.situacao` retornado pela API.

**Comportamento:**

| `contrato.status` | `contrato.situacao` | Label exibido | Classe badge |
|-------------------|----------------------|---------------|--------------|
| `ATIVO` | `EM_DIA` | **Pago** | `badge badge-success` |
| `ATIVO` | `EM_ABERTO` | Em aberto | `badge badge-warning` |
| `ATIVO` | `EM_ATRASO` | Em atraso | `badge badge-danger` |
| `ENCERRADO`, `RENOVADO` ou outro | qualquer | **—** | neutro (sem badge colorido de pagamento) |

**Implementação:** ajustar `getSituacaoContrato()` em `frontend/app/home/page.tsx`.

**Critério de aceite:**
- Contrato ativo com todos os meses devidos pagos → **"Pago"** (verde).
- Contrato ativo com parcela pendente antes do vencimento → **"Em aberto"** (amarelo).
- Contrato ativo inadimplente → **"Em atraso"** (vermelho).
- Contrato encerrado → **"—"**, não "Em aberto".

---

### RF-03 — Alerta "Contratos em atraso" condicional

**Descrição:** Box de alerta de inadimplência só aparece quando existir ≥1 contrato ativo em atraso.

**Comportamento:**
- Condição: `contratosEmAtraso.length > 0`, onde `contratosEmAtraso = contratos.filter(c => c.status === 'ATIVO' && c.situacao === 'EM_ATRASO')`.
- Quando visível: título "Contratos em atraso", contagem e lista com locatário, sala e endereço (comportamento atual da lista).
- Quando zero contratos em atraso: **nenhum elemento** de alerta renderizado (não mostrar "0 contrato(s)").

**Critério de aceite:** Com todos os contratos em dia ou em aberto, alerta **ausente** do DOM.

---

### RF-04 — Reset parcial ao trocar tipo de terreno

**Descrição:** Ao alterar o `<select>` de tipo no modal de terreno (create ou edit), campos **exclusivos do tipo anterior** são limpos; campos compartilhados permanecem.

**Campos exclusivos por tipo:**

| Tipo anterior | Campos zerados |
|---------------|----------------|
| `COMERCIAL` | `vagasGaragem`, `quantidadeSalas` |
| `RESIDENCIAL` | `metragemCasa` |

**Campos preservados:** `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `metragemTotal`, `observacoes`.

**Comportamento adicional:**
- `formatTerrenoPayload()` continua omitindo campos vazios/indefinidos.
- Submit após troca de tipo **não** inclui campos do tipo anterior preenchidos.

**Implementação sugerida:** handler dedicado `handleTipoChange(novoTipo)` em `frontend/app/terrenos/page.tsx` que detecta tipo anterior e aplica patch de limpeza.

**Critério de aceite:**
- Preencher vagas e quantidade de salas como COMERCIAL → trocar para RESIDENCIAL → campos comerciais vazios; endereço intacto.
- Preencher metragem da casa como RESIDENCIAL → trocar para COMERCIAL → `metragemCasa` vazia; endereço intacto.
- Submit após troca retorna **2xx** sem erro de validação backend por campos cruzados.

---

### RF-05 — Cadastro de sala sempre Disponível

**Descrição:** Modal **Nova sala** não exibe controle de status; sala é criada com `status: 'DISPONIVEL'`.

**Comportamento:**
- Remover `<select>` de status quando `modoEdicao === false`.
- Payload `POST /api/salas` envia `status: 'DISPONIVEL'` fixo (ignorar qualquer valor residual no state).
- Demais campos do formulário inalterados (identificação, metragem, terreno, observações).

**Critério de aceite:** Formulário de nova sala não contém campo "Status"; sala criada aparece como Disponível em `/salas` e no dashboard.

---

### RF-06 — Edição de sala com toggle de manutenção

**Descrição:** Modal **Editar sala** substitui o `<select>` de status por exibição read-only do status atual e checkbox **"Em manutenção"** para alternar MANUTENCAO ↔ DISPONIVEL.

**Comportamento:**

| Status atual (após sync) | UI |
|--------------------------|-----|
| `DISPONIVEL` | Badge "Disponível" + checkbox desmarcado |
| `MANUTENCAO` | Badge "Em manutenção" + checkbox marcado |
| `LOCADA` | Badge "Locada" + checkbox **desabilitado** + texto auxiliar (ex.: "Sala vinculada a contrato ativo") |

**Toggle:**
- Marcar checkbox → `status: 'MANUTENCAO'` no `PUT`.
- Desmarcar checkbox → `status: 'DISPONIVEL'` no `PUT`.
- Quando `LOCADA`: checkbox desabilitado; payload não altera status (ou envia status atual sem efeito — backend `syncStatus` preserva LOCADA).

**Regras preservadas (backend existente):**
- `SalaService.syncStatus()` continua recalculando LOCADA/DISPONIVEL a partir de contratos, exceto quando status é MANUTENCAO.
- Salas em manutenção permanecem excluídas do picker de contratos (`contratos/page.tsx`).

**Critério de aceite:**
- Marcar manutenção em sala disponível → status MANUTENCAO após save.
- Desmarcar manutenção → status DISPONIVEL após save.
- Sala locada: checkbox desabilitado; usuário não consegue forçar manutenção pela UI.

---

### RF-07 — Card condicional "Salas em manutenção" no dashboard

**Descrição:** Painel inicial exibe card adicional para salas em manutenção, **somente** quando existir ≥1 sala com `status === 'MANUTENCAO'`.

**Comportamento:**
- Card **"Salas disponíveis"** mantido (contagem + modal filtrado por `DISPONIVEL`) — sem alteração de comportamento.
- Novo card **"Salas em manutenção"**:
  - Visível iff `salasEmManutencao.length > 0`.
  - Contagem: `salas.filter(s => s.status === 'MANUTENCAO').length`.
  - Clique abre modal com tabela: colunas **Sala**, **Metragem**, **Terreno** (mesmo padrão do modal de disponíveis).
  - Estilo visual distinto do card de disponíveis (ex.: variante warning/danger — seguir tokens CSS existentes).
- Salas **locadas** não aparecem no dashboard (fora de escopo).

**Implementação:** estender `ModalType` em `home/page.tsx` (ex.: `'salas-manutencao'`) ou reutilizar modal com parâmetro de filtro.

**Critério de aceite:**
- Zero salas em manutenção → card **ausente**.
- ≥1 sala em manutenção → card visível com contagem correta; modal lista apenas salas MANUTENCAO.

---

## Regras de Negócio (referência — preservadas)

| RN | Descrição | Relação com esta feature |
|----|-----------|--------------------------|
| RN-01 | Situação de contrato derivada de cobranças (`PAGO` = mês quitado) | RF-01 expõe resultado; não altera cálculo |
| RN-02 | Terreno COMERCIAL vs RESIDENCIAL — campos mutuamente exclusivos | RF-04 evita violação no submit |
| RN-03 | Status LOCADA derivado de contrato ativo | RF-06 respeita; UI read-only quando locada |
| RN-04 | MANUTENCAO é status manual; exclui sala de novos contratos | RF-06 e RF-07 |

---

## Requisitos Não Funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | `.\mvnw.cmd test` verde após mudanças |
| RNF-02 | `cd frontend; npm run lint` sem erros |
| RNF-03 | Idioma da UI: português (Brasil) |
| RNF-04 | Nenhuma regressão nos fluxos de pagamentos, contratos e listagem `/salas` |
| RNF-05 | Compatibilidade JWT Bearer inalterada |

---

## Critérios de aceite globais (Definition of Done)

1. ✅ `GET /api/contratos` retorna campo `situacao` preenchido para contratos enriquecidos.
2. ✅ Coluna Situação: Pago / Em aberto / Em atraso / — conforme RF-02.
3. ✅ Alerta "Contratos em atraso" oculto quando não houver inadimplentes.
4. ✅ Troca de tipo de terreno limpa campos exclusivos; submit sem erro cruzado.
5. ✅ Nova sala sem campo de status; sempre Disponível.
6. ✅ Editar sala: toggle manutenção funciona nos dois sentidos; locada bloqueada.
7. ✅ Card "Salas em manutenção" condicional na home.
8. ✅ `.\mvnw.cmd test` e `npm run lint` verdes.

---

## Verificação

### Backend

```powershell
# Suite completa
.\mvnw.cmd test

# Foco contrato (situação + serialização)
.\mvnw.cmd "-Dtest=ContratoServiceTest,ContratoControllerTest" test
```

**Teste novo sugerido:** assert que objeto `Contrato` com `setSituacao("EM_DIA")` serializa campo no JSON (Jackson `ObjectMapper` ou `@WebMvcTest` em `ContratoControllerTest`).

### Frontend

```powershell
cd frontend; npm run lint
cd frontend; npm run build
```

### Smoke manual (obrigatório pós-implementação)

1. **Situação paga:** contrato ativo com cobranças em dia → coluna Situação **"Pago"**; alerta de atraso **ausente**.
2. **Situação em aberto:** contrato ativo com mês corrente não pago e antes do vencimento → **"Em aberto"**; alerta ausente.
3. **Situação atraso:** contrato com parcela vencida não paga → **"Em atraso"**; alerta visível com contrato na lista.
4. **Terreno:** preencher campos comerciais → trocar para residencial → campos comerciais vazios; salvar com metragem da casa → **sucesso**.
5. **Sala create:** modal sem status; sala criada como Disponível.
6. **Sala manutenção:** editar sala disponível → marcar manutenção → card na home aparece; desmarcar → card desaparece (se era a única).
7. **Sala locada:** editar sala com contrato ativo → checkbox manutenção desabilitado.

---

## Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Expor `situacao` confunde consumidores da API | Baixa | Campo `@Transient`; documentar como read-only derivado |
| Usuário desmarca manutenção; backend recalcula LOCADA se houver contrato | Baixa | RF-06 desabilita toggle quando locada |
| Card extra de manutenção quebra layout mobile do `summary-grid` | Média | Grid existente já responsivo; validar em 390px |
| Regressão em `formatTerrenoPayload` | Baixa | Smoke manual + submit após troca de tipo |

---

## Referências

- [ideas/correcoes-consistencia-dashboard-formularios.md](../../ideas/correcoes-consistencia-dashboard-formularios.md) — ideia aprovada
- `ContratoService.resolveSituacao()` — lógica de situação (já testada em `ContratoServiceTest`)
- `SalaService.syncStatus()` — lógica de status de sala
- `TerrenoService.validateTerreno()` — validação por tipo

---

## Próximo passo

Após **aprovação explícita** desta spec:

→ **`spec-planner`** — `specs/correcoes-consistencia-dashboard-formularios/plan.md`
