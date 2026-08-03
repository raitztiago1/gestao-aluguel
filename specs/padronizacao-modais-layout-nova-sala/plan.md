# Plano: Padronização dos modais pelo layout de “Nova sala”

**Status:** Implementado — smoke autenticado pendente  
**Data:** 2026-08-03  
**Aprovado em:** 2026-08-03  
**Spec:** `specs/padronizacao-modais-layout-nova-sala/about.md`  
**Stack:** Next.js 14, React 18, TypeScript 5 e CSS global  

---

## 1. Objetivo

Executar a spec aprovada em entregas pequenas, mantendo o sistema utilizável após cada tarefa. A ordem começa pela fundação compartilhada e por um piloto em sala, segue pelas páginas CRUD, depois pelos diálogos da home e termina com validação transversal.

---

## 2. Decisões técnicas do plano

### 2.1 Primitiva de diálogo

Usar o elemento HTML nativo `<dialog>` como base, controlado por React com `showModal()` e `close()`.

Motivos:

- coloca o painel na top layer do navegador;
- torna o conteúdo de fundo inerte enquanto modal;
- fornece semântica nativa e comportamento de foco;
- suporta diálogos empilhados, necessário para confirmar exclusão de pagamento;
- evita adicionar uma dependência ao projeto.

O componente ainda será responsável por título/descrição acessíveis, política de backdrop, bloqueio explícito de scroll, estado bloqueado e devolução previsível do foco.

### 2.2 Componentes previstos

- `Modal`: fundação genérica sem conhecimento de domínio.
- `ConfirmDialog`: composição destrutiva sobre `Modal`.

Os nomes podem mudar durante a implementação apenas se a responsabilidade permanecer equivalente e o plano for atualizado.

### 2.3 Compatibilidade durante a migração

`useEscapeKey` e o JSX legado permanecerão disponíveis para páginas ainda não migradas. Cada página deixa de usar o hook para seus diálogos assim que passa a usar `Modal`, evitando dois listeners de `Escape` no mesmo fluxo.

### 2.4 Estratégia de teste

O frontend não possui suíte automatizada. Cada tarefa usará:

- lint como verificação estática;
- build nos checkpoints estruturais e no fechamento;
- roteiro manual objetivo para comportamento visual, teclado e fluxo.

Não será adicionada infraestrutura de testes sem nova decisão de escopo.

---

## 3. Dependências

1. T01 cria e exercita a fundação com o formulário de sala.
2. T02 cria a confirmação compartilhada e a exercita com exclusão de sala.
3. T03, T04 e T05 migram os demais CRUDs e dependem de T01 e T02.
4. T06 migra os resumos da home e depende de T01.
5. T07 migra o diálogo de pagamentos e depende de T01.
6. T08 migra a confirmação empilhada de pagamento e depende de T02 e T07.
7. T09 realiza o endurecimento transversal após todos os consumidores estarem migrados.
8. T10 verifica a entrega completa e registra evidências.

T03, T04 e T05 podem ser executadas independentemente entre si depois de T02.

---

## 4. Tarefas

### T01 — Criar `Modal` e migrar o formulário de sala

**Objetivo:** construir a fundação acessível e validar sua API no modal usado como referência visual.

**Requisitos cobertos:** RF-01 a RF-06, RF-10, RF-11, RI-01 a RI-06, RV-01, RV-04 a RV-06, RA-01 a RA-06, RR-01 a RR-04, RNF-01, RNF-03 a RNF-06.

**Arquivos:**

- adicionar `frontend/app/components/Modal.tsx`;
- modificar `frontend/app/globals.css`;
- modificar `frontend/app/salas/page.tsx`.

**Passos:**

1. Implementar `Modal` como client component sobre `<dialog>`.
2. Definir props para título, descrição, tamanho, conteúdo, ações, fechamento, backdrop e estado bloqueado.
3. Gerar associações acessíveis estáveis para título e descrição.
4. Controlar abertura, `cancel`/`Escape`, clique real no backdrop e botão “Fechar”.
5. Bloquear/restaurar o scroll da página com segurança, inclusive se houver mais de um diálogo aberto.
6. Capturar e devolver foco ao acionador quando ele ainda existir.
7. Adaptar as classes `.modal-*` ao elemento nativo sem alterar a linguagem visual de sala.
8. Migrar apenas o formulário de sala, removendo seu listener redundante de `useEscapeKey`.
9. Manter as seções, erros, estado, submit e `resetForm` atuais.
10. Configurar formulário para não fechar ao clicar no backdrop.

**Critérios de aceite:**

- “Nova sala” e “Editar sala” usam `Modal`.
- O painel mantém as três seções e a aparência de referência.
- `Escape`, fechar e cancelar limpam o formulário uma única vez.
- Clique no backdrop não fecha nem apaga o formulário.
- `Tab` não alcança a página de fundo.
- Fechar devolve o foco ao botão/ação que abriu o formulário.
- Criar e editar sala continuam funcionando com o mesmo payload.

**Verificação:**

```powershell
cd frontend; npm run lint; npm run build
```

Manual: testar criação, edição, erro de validação, backdrop, `Escape`, `Tab`, `Shift+Tab`, foco devolvido e viewport móvel em `/salas`.

---

### T02 — Criar `ConfirmDialog` e migrar exclusão de sala

**Objetivo:** substituir a primeira confirmação nativa e validar o contrato de exclusão compartilhado.

**Requisitos cobertos:** RF-15 a RF-19, RI-01 a RI-06, RV-03 a RV-06, RA-01 a RA-06, RNF-03 a RNF-06.

**Arquivos:**

- adicionar `frontend/app/components/ConfirmDialog.tsx`;
- modificar `frontend/app/globals.css`;
- modificar `frontend/app/salas/page.tsx`.

**Passos:**

1. Compor `ConfirmDialog` sobre `Modal`, sem acesso direto à API.
2. Definir título, mensagem, ação destrutiva, cancelamento, estado pendente e callback assíncrono.
3. Focar “Cancelar” inicialmente.
4. Impedir fechamento por backdrop e múltiplas confirmações durante a requisição.
5. Manter o diálogo aberto durante a operação; fechar somente no sucesso.
6. Migrar `excluirSala`, removendo `window.confirm`.
7. Manter o tratamento de erro e recarregamento atuais.

**Critérios de aceite:**

- Exclusão de sala não usa `window.confirm`.
- Cancelar, `Escape` ou backdrop não envia `DELETE`.
- “Excluir” dispara uma única requisição.
- O estado “Excluindo...” é perceptível e impede clique duplo.
- Erro mantém a sala na lista e usa o tratamento existente.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: cancelar por botão e `Escape`, clicar no backdrop, confirmar uma vez, tentar clique duplo e simular/observar falha de API em `/salas`.

---

### T03 — Migrar modal e exclusão de terreno

**Objetivo:** aplicar os componentes compartilhados ao CRUD de terreno.

**Requisitos cobertos:** RF-07, RF-10, RF-11, RF-15 a RF-19, RV-01 a RV-05, RR-01 a RR-04, RNF-02 a RNF-07.

**Arquivo:**

- modificar `frontend/app/terrenos/page.tsx`.

**Passos:**

1. Substituir o shell JSX legado por `Modal`.
2. Organizar os campos existentes em seções coerentes, incluindo identificação, endereço e características específicas do tipo de terreno.
3. Preservar campos condicionais, `AddressFields`, máscaras, validações, erros e payload.
4. Configurar o backdrop para não fechar o formulário.
5. Remover o uso de `useEscapeKey` apenas para esse modal.
6. Substituir `window.confirm` por `ConfirmDialog`.
7. Preservar recarregamento e mensagens após criar, editar ou excluir.

**Critérios de aceite:**

- Criar e editar terrenos comerciais e residenciais mantém todas as regras atuais.
- Seções seguem a hierarquia visual de sala.
- Fechamento limpa corretamente o estado.
- A exclusão só ocorre após confirmação explícita.
- Fluxo funciona por teclado e em viewport móvel.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: criar/editar os dois tipos de terreno, validar campos condicionais, endereço, cancelamento e exclusão em `/terrenos`.

---

### T04 — Migrar modal e exclusão de locatário

**Objetivo:** aplicar os componentes compartilhados ao CRUD de locatário.

**Requisitos cobertos:** RF-08, RF-10, RF-11, RF-15 a RF-19, RV-01 a RV-05, RR-01 a RR-04, RNF-02 a RNF-07.

**Arquivo:**

- modificar `frontend/app/locatarios/page.tsx`.

**Passos:**

1. Substituir o shell JSX legado por `Modal`.
2. Agrupar os campos existentes em seções de identificação, contato/endereço e documentos, sem alterar os dados coletados.
3. Preservar os comportamentos condicionais de pessoa física e jurídica.
4. Preservar `AddressFields`, máscaras, validações, erros e payload.
5. Configurar o backdrop para não fechar o formulário e remover seu listener redundante.
6. Substituir `window.confirm` por `ConfirmDialog`.

**Critérios de aceite:**

- Criar e editar PF e PJ mantém campos condicionais e regras atuais.
- Erros permanecem dentro do diálogo sem limpar dados.
- Fechamento e reabertura não carregam estado obsoleto.
- Exclusão exige confirmação customizada.
- Fluxo funciona por teclado e em viewport móvel.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: criar/editar PF e PJ, validar máscaras, endereço, documentos, erros, cancelamento e exclusão em `/locatarios`.

---

### T05 — Migrar modal e exclusão de contrato

**Objetivo:** aplicar os componentes compartilhados ao formulário mais complexo sem regressão de domínio.

**Requisitos cobertos:** RF-09 a RF-11, RF-15 a RF-19, RV-01 a RV-05, RR-01 a RR-04, RNF-02 a RNF-07.

**Arquivo:**

- modificar `frontend/app/contratos/page.tsx`.

**Passos:**

1. Substituir o shell JSX legado por `Modal`.
2. Agrupar o conteúdo existente em seções claras para dados do contrato, garantia e despesas adicionais.
3. Preservar garantia XOR, fiador/caução, datas, valores, despesas opcionais, documento, validações e payload.
4. Manter `ErrorAlert` dentro do diálogo.
5. Configurar backdrop sem fechamento e remover seu listener redundante.
6. Substituir `window.confirm` por `ConfirmDialog`.

**Critérios de aceite:**

- Criar e editar contratos com fiador ou caução mantém a regra XOR.
- Despesas adicionais preservam toggles, campos e validações.
- Conteúdo longo rola internamente com ações alcançáveis.
- Exclusão exige confirmação customizada.
- Fluxo funciona por teclado e em viewport móvel.

**Verificação:**

```powershell
cd frontend; npm run lint; npm run build
```

Manual: testar criação/edição com cada garantia, despesas adicionais, erro de validação, scroll, cancelamento e exclusão em `/contratos`.

---

### T06 — Migrar os resumos da home

**Objetivo:** aplicar a variante de listagem aos quatro resumos sem duplicar o shell.

**Requisitos cobertos:** RF-12, RF-14, RI-01 a RI-06, RV-01, RV-04 a RV-06, RA-01 a RA-06, RR-01 a RR-04, RNF-02 a RNF-07.

**Arquivo:**

- modificar `frontend/app/home/page.tsx`.

**Passos:**

1. Migrar o bloco compartilhado dos quatro resumos para `Modal`.
2. Manter título dinâmico, descrição, filtros, tabelas, badges e estados vazios.
3. Permitir fechamento por backdrop, botão e `Escape`.
4. Remover o listener de `useEscapeKey` correspondente aos resumos.
5. Garantir que tabelas largas rolem dentro da região `.table-scroll`.
6. Garantir retorno de foco ao card que abriu cada resumo.

**Critérios de aceite:**

- Terrenos, contratos ativos, salas disponíveis e salas em manutenção exibem os mesmos dados.
- Estado vazio continua correto em cada resumo.
- Backdrop e `Escape` fecham somente o resumo aberto.
- Tabelas não geram overflow horizontal na página.
- O foco retorna ao card acionador.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: abrir os quatro resumos, testar dados e estado vazio, scroll horizontal, backdrop, `Escape` e foco devolvido em `/home`.

---

### T07 — Migrar o diálogo de gerenciamento de pagamentos

**Objetivo:** aplicar a variante ampla ao fluxo híbrido de histórico e formulário.

**Requisitos cobertos:** RF-13, RF-14, RF-20 parcialmente, RF-10, RI-01 a RI-06, RV-01 a RV-06, RA-01 a RA-06, RR-01 a RR-04, RNF-02 a RNF-07.

**Arquivos:**

- modificar `frontend/app/home/page.tsx`;
- modificar `frontend/app/globals.css`, somente se a variante ampla exigir ajuste não contemplado em T01.

**Passos:**

1. Migrar o diálogo de pagamentos para `Modal` com tamanho amplo.
2. Preservar contrato selecionado, histórico, formulário inline e todas as ações condicionais.
3. Organizar histórico e formulário com a mesma linguagem de seções.
4. Configurar backdrop sem fechamento para evitar perda de formulário em andamento.
5. Remover o listener de `useEscapeKey` correspondente a pagamentos.
6. Preservar erros e atualização de dados após sucesso.

**Critérios de aceite:**

- Abrir pagamentos continua carregando contrato e cobranças corretos.
- Adicionar e editar pagamento usa os mesmos dados e resultados atuais.
- Backdrop não fecha nem apaga o formulário inline.
- Tabela e formulário permanecem utilizáveis em desktop e mobile.
- `Escape` fecha apenas o diálogo quando não há outro sobre ele.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: abrir contratos diferentes, adicionar/editar/cancelar pagamento, validar erros, scroll e responsividade em `/home`.

---

### T08 — Migrar exclusão de pagamento e validar empilhamento

**Objetivo:** concluir as confirmações destrutivas e garantir dois níveis de diálogo.

**Requisitos cobertos:** RF-15 a RF-20, RI-01 a RI-06, RA-01 a RA-06, RNF-02 a RNF-07.

**Arquivo:**

- modificar `frontend/app/home/page.tsx`.

**Passos:**

1. Substituir o `window.confirm` de pagamento por `ConfirmDialog`.
2. Manter o diálogo de pagamentos aberto sob a confirmação.
3. Garantir que somente a confirmação superior receba foco e responda a `Escape`.
4. Devolver foco à ação de excluir do pagamento ao cancelar.
5. Bloquear confirmação duplicada durante `DELETE`.
6. Após sucesso, fechar a confirmação, atualizar cobranças e manter o gerenciamento de pagamentos aberto.
7. Em falha, preservar o item e apresentar o erro pelo fluxo existente.

**Critérios de aceite:**

- Não existe mais `window.confirm` em `frontend/app`.
- Cancelar fecha apenas a confirmação.
- `Escape` fecha um único nível por vez.
- A confirmação não permite interação com o diálogo inferior.
- Sucesso atualiza o histórico sem fechar o gerenciamento.
- Falha mantém o pagamento visível.

**Verificação:**

```powershell
cd frontend; npm run lint
```

Manual: cancelar, confirmar, tentar clique duplo, testar `Escape` em dois níveis e observar foco antes/depois em `/home`.

Verificação textual adicional:

```powershell
rg "window\.confirm" frontend/app
```

Resultado esperado: nenhum match.

---

### T09 — Endurecer acessibilidade e responsividade transversal

**Objetivo:** revisar os componentes centrais e estilos após todos os casos reais estarem conectados.

**Requisitos cobertos:** RF-01 a RF-05, RF-14, RI-01 a RI-06, RV-01 a RV-06, RA-01 a RA-06, RR-01 a RR-04, RNF-01, RNF-03 a RNF-07.

**Arquivos:**

- modificar `frontend/app/components/Modal.tsx`;
- modificar `frontend/app/components/ConfirmDialog.tsx`;
- modificar `frontend/app/globals.css`.

**Passos:**

1. Revisar semântica, associações de título/descrição e nome do botão de fechar.
2. Validar eventos `cancel`, `close`, backdrop e estado bloqueado.
3. Validar scroll lock com um e dois diálogos e restauração no unmount.
4. Validar foco inicial e retorno de foco em todos os tipos de consumidor.
5. Ajustar breakpoints, margens, grids, ações, tamanhos touch e tabelas.
6. Adicionar ou revisar foco visível, disabled, contraste e estilo destrutivo.
7. Garantir que qualquer animação respeite `prefers-reduced-motion`.
8. Remover CSS `.modal-*` legado que não tenha mais consumidor, sem remover classes ainda usadas.

**Critérios de aceite:**

- Semântica acessível está presente em todas as variantes.
- Fundo não recebe foco/interação.
- Scroll lock não permanece após fechar.
- Dois diálogos fecham um nível por `Escape`.
- Nenhum conteúdo ultrapassa a viewport em larguras estreitas.
- Foco, hover e disabled são perceptíveis.
- Não há CSS legado comprovadamente órfão da implementação anterior.

**Verificação:**

```powershell
cd frontend; npm run lint; npm run build
```

Manual: executar a matriz de teclado, foco, backdrop, scroll e mobile descrita na seção 14 da spec.

---

### T10 — Verificação final e registro de evidências

**Objetivo:** comprovar os requisitos da spec antes da validação de compliance.

**Requisitos cobertos:** todos.

**Arquivo:**

- modificar `.cursor/sdd/progress.md`.

**Passos:**

1. Executar lint e build de produção.
2. Confirmar ausência de `window.confirm`.
3. Executar o roteiro manual completo da spec em desktop e viewport móvel.
4. Verificar criar/editar/excluir de cada CRUD e os quatro resumos.
5. Verificar adicionar/editar/excluir pagamento.
6. Registrar status e evidências de T01 a T10 em `.cursor/sdd/progress.md`.
7. Após esta tarefa, executar a skill **spec-validator** e gerar o review de compliance.

**Critérios de aceite:**

- Lint e build verdes.
- Nenhuma confirmação nativa remanescente no escopo.
- Todos os cenários CA-01 a CA-11 têm evidência.
- Regressões encontradas são corrigidas e verificadas antes de concluir.
- Progresso SDD está atualizado.

**Verificação:**

```powershell
cd frontend; npm run lint; npm run build
rg "window\.confirm" app
```

Resultado esperado: lint e build com exit code `0`; busca sem matches.

---

## 5. Matriz de cobertura

- RF-01 a RF-05: T01 e T09.
- RF-06: T01.
- RF-07: T03.
- RF-08: T04.
- RF-09: T05.
- RF-10 e RF-11: T01, T03, T04, T05 e T07.
- RF-12: T06.
- RF-13: T07.
- RF-14: T06, T07 e T09.
- RF-15 a RF-19: T02, T03, T04, T05 e T08.
- RF-20: T08 e T09.
- RI-01 a RI-06: T01, T02, T06, T07, T08 e T09.
- RV-01 a RV-06: T01 a T09 conforme o tipo de conteúdo.
- RA-01 a RA-06: T01, T02, T06, T07, T08 e T09.
- RR-01 a RR-04: T01, T03 a T07 e T09.
- RNF-01 a RNF-07: T01 a T10.
- CA-01 a CA-11: T10.

Não há requisito da spec sem tarefa correspondente.

---

## 6. Gate de aprovação

Este plano está pronto para revisão humana. Nenhuma tarefa de implementação deve começar antes da aprovação explícita.

Após aprovação:

1. alterar o status para **Aprovado para implementação**;
2. executar com **subagent-driven-development**, uma tarefa por vez;
3. aplicar **test-driven-development** dentro das limitações documentadas do frontend;
4. atualizar `.cursor/sdd/progress.md` ao concluir cada tarefa;
5. executar **spec-validator** antes de declarar a feature pronta.
