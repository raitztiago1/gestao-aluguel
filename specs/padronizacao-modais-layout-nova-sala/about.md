# Spec: Padronização dos modais pelo layout de “Nova sala”

**Status:** Implementada — validação manual autenticada pendente  
**Data:** 2026-08-03  
**Aprovada em:** 2026-08-03  
**Ideia aprovada:** `ideas/padronizacao-modais-layout-nova-sala.md`  
**Escopo técnico:** frontend Next.js 14 / React 18 / TypeScript 5  

---

## 1. Resumo

Padronizar todos os diálogos do sistema usando o modal de criação/edição de sala como referência visual. A mudança deve substituir as estruturas JSX duplicadas por uma fundação reutilizável, acessível e responsiva, com variantes para:

- formulários CRUD;
- resumos e listagens;
- gerenciamento de pagamentos;
- confirmações destrutivas.

As regras de negócio, payloads, endpoints e resultados dos fluxos atuais não serão alterados.

---

## 2. Problema e objetivo

Hoje os diálogos são implementados diretamente nas páginas de sala, terreno, locatário, contrato e home. Eles compartilham classes globais, mas repetem backdrop, cabeçalho, fechamento e conteúdo. As exclusões dependem de `window.confirm`.

O objetivo é obter:

1. uma linguagem visual coerente baseada no modal “Nova sala”;
2. comportamento previsível em qualquer diálogo;
3. acessibilidade por teclado e gerenciamento correto de foco;
4. componentes reutilizáveis sem acoplamento às entidades do domínio;
5. preservação integral dos fluxos existentes.

---

## 3. Escopo

### 3.1 Incluído

- Fundação compartilhada de diálogo.
- Variante de formulário para:
  - nova/editar sala;
  - novo/editar terreno;
  - novo/editar locatário;
  - novo/editar contrato.
- Variante de listagem/resumo para:
  - terrenos cadastrados;
  - contratos ativos;
  - salas disponíveis;
  - salas em manutenção.
- Variante ampla/híbrida para gerenciamento de pagamentos.
- Diálogo compartilhado de confirmação para exclusão de:
  - sala;
  - terreno;
  - locatário;
  - contrato;
  - pagamento.
- Ajustes necessários em `frontend/app/globals.css`.
- Acessibilidade, responsividade e testes manuais dos diálogos.

### 3.2 Excluído

- Alterações no backend, banco de dados ou contratos da API.
- Novas operações CRUD ou novas regras de validação.
- Redesenho de tabelas e páginas fora do contexto dos diálogos.
- Conversão do menu mobile em diálogo.
- Troca geral da identidade visual da aplicação.
- Introdução obrigatória de uma biblioteca visual ou de testes.

---

## 4. Inventário de referência

### 4.1 Implementações atuais

- `frontend/app/salas/page.tsx`
- `frontend/app/terrenos/page.tsx`
- `frontend/app/locatarios/page.tsx`
- `frontend/app/contratos/page.tsx`
- `frontend/app/home/page.tsx`
- `frontend/app/hooks/useEscapeKey.ts`
- `frontend/app/globals.css`

### 4.2 Referência visual

O modal de sala define a linguagem inicial:

- cabeçalho com título, descrição e botão de fechar;
- corpo rolável;
- conteúdo agrupado em `form-section`;
- mensagens de erro dentro do diálogo;
- campos organizados em grids;
- ações primária e secundária;
- cards informativos, badge de status e toggle destacado quando aplicável.

Essa referência não obriga tabelas e confirmações a usar estrutura de formulário.

---

## 5. Personas e jornadas

### Persona principal

Usuário administrativo que gerencia imóveis, locatários, contratos e pagamentos em desktop ou dispositivo móvel.

### Jornadas cobertas

1. Abrir um formulário, preencher dados, salvar ou cancelar.
2. Abrir um resumo da home, consultar uma tabela e fechar.
3. Gerenciar cobranças e pagamentos em um diálogo amplo.
4. Solicitar uma exclusão, revisar a consequência, confirmar ou cancelar.
5. Executar qualquer uma dessas jornadas usando somente teclado.

---

## 6. Requisitos funcionais

### Fundação do diálogo

**RF-01 — Componente compartilhado**  
Todos os diálogos incluídos no escopo devem usar a mesma fundação reutilizável para backdrop, painel, cabeçalho, corpo e rodapé opcional.

**RF-02 — Composição**  
A fundação deve aceitar, no mínimo:

- título obrigatório;
- descrição opcional;
- conteúdo arbitrário;
- ações opcionais;
- função de fechamento;
- tamanho/variante visual;
- política de fechamento pelo backdrop;
- identificação acessível gerada ou fornecida pelo consumidor.

**RF-03 — Tamanhos**  
Devem existir tamanhos adequados a:

- confirmação curta;
- formulário ou resumo padrão;
- conteúdo amplo, usado pelo gerenciamento de pagamentos e por tabelas que precisem de mais espaço.

**RF-04 — Cabeçalho e corpo**  
O título, a descrição e o botão de fechar devem permanecer visualmente separados do conteúdo. Quando o conteúdo ultrapassar a altura disponível, somente a região apropriada deve rolar, mantendo disponíveis os controles essenciais de fechamento.

**RF-05 — Área de ações**  
Formulários e confirmações devem apresentar ações em uma posição consistente. Em conteúdo longo, as ações devem continuar acessíveis sem depender da rolagem da página por trás do diálogo.

### Formulários CRUD

**RF-06 — Modal de sala**  
O modal de sala deve ser migrado para a fundação compartilhada sem perder:

- modos de criação e edição;
- seções “Dados da sala”, “Status da sala” e “Observações”;
- badge, card informativo e toggle de status;
- máscaras, validações, erros e payload atual.

**RF-07 — Modal de terreno**  
O modal de terreno deve usar a mesma hierarquia visual do modal de sala, agrupando campos relacionados em seções compreensíveis, sem alterar campos, validações, endereço ou payload.

**RF-08 — Modal de locatário**  
O modal de locatário deve usar a mesma hierarquia visual do modal de sala, preservando os comportamentos condicionais de pessoa física/jurídica, endereço, documentos, máscaras, validações e payload.

**RF-09 — Modal de contrato**  
O modal de contrato deve usar a mesma hierarquia visual do modal de sala, preservando garantia XOR, fiador/caução, datas, valores, despesas adicionais, validações e payload.

**RF-10 — Erros de formulário**  
Erros de criação/edição devem continuar visíveis dentro do diálogo correspondente e não podem fechar ou limpar o formulário automaticamente.

**RF-11 — Salvamento e cancelamento**  
Salvar deve manter o comportamento atual de cada página. Cancelar ou fechar deve executar a rotina de limpeza já definida pelo fluxo, sem deixar modo de edição ou erro obsoleto para a próxima abertura.

### Resumos e pagamentos

**RF-12 — Resumos da home**  
Os quatro resumos da home devem usar a variante de listagem, preservando:

- títulos e descrição;
- dados, filtros já aplicados e status;
- mensagens de estado vazio;
- tabelas e rolagem horizontal quando necessária.

**RF-13 — Gerenciamento de pagamentos**  
O diálogo de pagamentos deve usar a variante ampla e preservar:

- contrato selecionado;
- histórico de cobranças;
- criação e edição de pagamento;
- campos e ações condicionais;
- exclusão;
- mensagens de erro;
- atualização dos dados após operações bem-sucedidas.

**RF-14 — Conteúdo tabular**  
Tabelas não podem aumentar o painel além da viewport. Quando não couberem horizontalmente, devem rolar dentro de sua região sem provocar rolagem horizontal da página.

### Confirmações destrutivas

**RF-15 — Substituição de confirmação nativa**  
Nenhuma das cinco exclusões incluídas no escopo pode usar `window.confirm`.

**RF-16 — Conteúdo da confirmação**  
O diálogo de confirmação deve informar:

- ação que será realizada;
- entidade ou contexto identificável;
- que a ação não pode ser desfeita;
- ação segura “Cancelar”;
- ação destrutiva “Excluir”.

**RF-17 — Momento da exclusão**  
A requisição `DELETE` só pode ser enviada após ativação explícita de “Excluir”. Fechar, pressionar `Escape`, clicar em “Cancelar” ou interagir com o backdrop não pode excluir.

**RF-18 — Estado pendente**  
Enquanto a exclusão estiver em andamento:

- uma segunda confirmação não pode disparar outra requisição;
- as ações incompatíveis devem ficar desabilitadas;
- o usuário deve receber indicação textual de andamento;
- o diálogo só fecha automaticamente após sucesso.

**RF-19 — Falha na exclusão**  
Se a API rejeitar a exclusão, a mensagem de erro deve continuar sendo apresentada pelo fluxo da página e nenhuma atualização otimista pode remover o item da interface.

**RF-20 — Confirmação sobre pagamentos**  
Ao excluir um pagamento, a confirmação pode ser exibida sobre o diálogo de gerenciamento de pagamentos. Apenas o diálogo superior deve responder ao foco e ao `Escape`; ao cancelar, o usuário deve retornar ao ponto anterior no diálogo de pagamentos.

---

## 7. Regras de interação

**RI-01 — Abertura e foco inicial**

- Ao abrir, o diálogo captura o elemento que estava focado.
- Em formulários, o foco vai para o primeiro campo útil, salvo quando houver motivo acessível para priorizar outro controle.
- Em resumos, o foco vai para o título/painel ou botão de fechar.
- Em confirmações destrutivas, o foco inicial deve favorecer “Cancelar”, nunca “Excluir”.

**RI-02 — Retenção e devolução de foco**

- `Tab` e `Shift+Tab` devem circular apenas entre elementos interativos do diálogo superior.
- Ao fechar, o foco retorna ao elemento que abriu o diálogo, quando ele ainda existir.

**RI-03 — Tecla Escape**

- `Escape` fecha o diálogo superior quando nenhuma operação assíncrona bloqueadora estiver em andamento.
- Em diálogos empilhados, um único `Escape` não pode fechar mais de um nível.

**RI-04 — Backdrop**

- Resumos somente leitura podem fechar ao clicar no backdrop.
- Formulários não fecham ao clicar no backdrop, evitando perda acidental de dados.
- Confirmações destrutivas não fecham ao clicar no backdrop.
- O clique dentro do painel nunca pode acionar o backdrop.

**RI-05 — Botão de fechar**

- O botão deve ter nome acessível “Fechar”.
- Formulários, resumos e pagamentos exibem o botão.
- A confirmação destrutiva pode omitir o botão “X” desde que “Cancelar” esteja sempre disponível.

**RI-06 — Scroll**

- Enquanto ao menos um diálogo estiver aberto, o scroll da página de fundo fica bloqueado.
- O conteúdo que exceder a viewport rola dentro do diálogo.
- Ao fechar todos os diálogos, o comportamento anterior da página é restaurado.

---

## 8. Requisitos visuais

**RV-01 — Identidade comum**  
Backdrop, raio, sombra, superfícies, bordas, tipografia, espaçamentos e estados de foco devem ser consistentes entre variantes e partir da linguagem existente do modal de sala.

**RV-02 — Seções**  
Formulários longos devem agrupar campos relacionados em seções com título. Seções não podem ser criadas apenas para envolver um único campo sem ganho de compreensão.

**RV-03 — Hierarquia de ações**  
A ação principal usa o estilo primário existente; cancelar usa o estilo secundário; excluir usa um estilo destrutivo inequívoco que não pode ser confundido com a ação principal comum.

**RV-04 — Estados interativos**  
Botões, links, campos e botão de fechar devem ter estados perceptíveis de foco, hover e disabled.

**RV-05 — Erros**  
O `ErrorAlert` deve permanecer visualmente associado ao conteúdo que falhou e não pode ser ocultado por cabeçalho ou rodapé.

**RV-06 — Movimento**  
Animações, se adicionadas, devem ser discretas e respeitar `prefers-reduced-motion`.

---

## 9. Requisitos de acessibilidade

**RA-01 — Semântica**  
O painel deve expor semântica de diálogo, estado modal e nome acessível associado ao título. A descrição, quando existir, deve estar corretamente associada.

**RA-02 — Teclado**  
Abrir, percorrer, acionar ações, cancelar e fechar deve ser possível sem mouse.

**RA-03 — Foco visível**  
Todo elemento interativo deve exibir foco visível com contraste suficiente.

**RA-04 — Fundo inerte**  
Conteúdo atrás do diálogo não pode receber foco ou interação enquanto o diálogo estiver aberto.

**RA-05 — Mensagens e carregamento**  
Erros e estados assíncronos relevantes devem ser anunciáveis por tecnologia assistiva usando a semântica já oferecida pelos componentes ou atributos apropriados.

**RA-06 — Contraste e alvos**  
Texto, bordas informativas, estados destrutivos e controles devem manter contraste legível. Controles de fechar e ações devem ter área de interação adequada também em telas touch.

---

## 10. Responsividade

**RR-01 — Viewport**  
Nenhum diálogo pode ultrapassar a largura ou altura útil da viewport.

**RR-02 — Desktop**  
Em largura confortável, formulários podem usar grids com múltiplas colunas e o diálogo de pagamentos pode usar a variante ampla.

**RR-03 — Mobile**  
Em telas estreitas:

- backdrop e painel mantêm margem segura;
- grids passam para uma coluna quando necessário;
- cabeçalho e ações não se sobrepõem;
- ações podem ocupar largura total ou quebrar linha;
- tabelas permanecem contidas em rolagem própria;
- todos os campos e botões continuam alcançáveis.

**RR-04 — Teclado virtual**  
O campo focado e as ações necessárias devem permanecer alcançáveis quando a viewport for reduzida por teclado virtual.

---

## 11. Requisitos não funcionais

**RNF-01 — Compatibilidade**  
A implementação deve funcionar no stack atual: Next.js 14, React 18 e TypeScript 5.

**RNF-02 — Sem regressão de domínio**  
Não alterar URLs, métodos HTTP, payloads, validações ou regras de negócio.

**RNF-03 — Reutilização**  
Páginas consumidoras não devem reproduzir manualmente a estrutura base de backdrop, semântica, cabeçalho e gerenciamento de foco.

**RNF-04 — Isolamento**  
A fundação não deve importar tipos ou serviços específicos de sala, terreno, locatário, contrato ou cobrança.

**RNF-05 — Dependências**  
Uma dependência externa só deve ser adicionada se o plano demonstrar necessidade e benefício frente ao custo. A spec não exige biblioteca de diálogo.

**RNF-06 — Idioma**  
Textos visíveis e nomes acessíveis permanecem em português do Brasil.

**RNF-07 — Qualidade**  
O frontend deve passar em lint e build de produção sem novos erros ou avisos causados pela mudança.

---

## 12. Contratos de componentes esperados

Os nomes finais podem ser definidos no plano, mas a solução deve oferecer responsabilidades equivalentes a:

### Diálogo base

- renderização condicional controlada pelo consumidor;
- título e descrição;
- conteúdo e ações por composição;
- tamanho `small`, `default` ou `large`;
- callback de fechamento;
- configuração explícita de backdrop;
- estado bloqueado durante operação assíncrona;
- IDs acessíveis estáveis por instância.

### Confirmação

- usa o diálogo base;
- recebe título, mensagem, rótulo da ação e callback de confirmação;
- expõe estado pendente;
- aplica semântica e estilo destrutivos;
- não conhece endpoints nem executa requisições diretamente.

---

## 13. Cenários de aceite

### CA-01 — Formulário de sala

**Dado** que o usuário abre “Nova sala”  
**Quando** navega pelos campos e salva dados válidos  
**Então** o fluxo usa a fundação compartilhada, mantém as seções de referência e cria a sala como antes.

### CA-02 — Formulário longo

**Dado** um modal de contrato em uma viewport com pouca altura  
**Quando** o conteúdo excede o espaço disponível  
**Então** o conteúdo rola internamente e fechar/cancelar/salvar continuam alcançáveis.

### CA-03 — Backdrop de formulário

**Dado** um formulário aberto e parcialmente preenchido  
**Quando** o usuário clica fora do painel  
**Então** o diálogo permanece aberto e os dados digitados permanecem intactos.

### CA-04 — Resumo da home

**Dado** um resumo aberto  
**Quando** o usuário clica no backdrop ou pressiona `Escape`  
**Então** apenas esse resumo fecha e o foco retorna ao card que o abriu.

### CA-05 — Cancelar exclusão

**Dado** que o usuário solicita excluir uma entidade  
**Quando** cancela, pressiona `Escape` ou tenta fechar pelo backdrop  
**Então** nenhuma requisição `DELETE` é enviada e a entidade permanece visível.

### CA-06 — Confirmar exclusão

**Dado** um diálogo de confirmação aberto  
**Quando** o usuário ativa “Excluir” uma vez  
**Então** apenas uma requisição é enviada, o estado pendente é exibido e o diálogo fecha após sucesso.

### CA-07 — Falha ao excluir

**Dado** que a API rejeita a exclusão  
**Quando** a tentativa termina  
**Então** o item permanece visível e o erro é apresentado pelo fluxo existente.

### CA-08 — Exclusão de pagamento empilhada

**Dado** o gerenciamento de pagamentos aberto  
**Quando** o usuário abre a confirmação de exclusão de um pagamento  
**Então** o foco fica apenas na confirmação; ao cancelar, retorna à ação do pagamento sem fechar o diálogo inferior.

### CA-09 — Navegação por teclado

**Dado** qualquer diálogo aberto  
**Quando** o usuário navega com `Tab` e `Shift+Tab`  
**Então** o foco não alcança elementos da página atrás do diálogo e permanece visível.

### CA-10 — Mobile

**Dado** uma viewport móvel  
**Quando** qualquer variante é aberta  
**Então** não há overflow da página, sobreposição de ações ou controle inacessível.

### CA-11 — Regressão funcional

**Dado** cada fluxo migrado  
**Quando** o usuário cria, edita, consulta, paga ou exclui  
**Então** os dados enviados e os resultados observáveis permanecem equivalentes aos fluxos anteriores.

---

## 14. Verificação

### Automatizada

Executar em `frontend/`:

```powershell
npm run lint
npm run build
```

O projeto não possui suíte de testes frontend. A introdução de uma suíte não faz parte obrigatória desta feature.

### Manual

Validar em desktop e viewport móvel:

- abrir e fechar cada diálogo;
- foco inicial e retorno de foco;
- ciclo de `Tab` e `Shift+Tab`;
- `Escape` com um e dois diálogos;
- política de backdrop por variante;
- scroll da página bloqueado;
- scroll interno de formulários e tabelas;
- criar e editar cada entidade;
- listar os quatro resumos;
- adicionar, editar e excluir pagamento;
- cancelar e confirmar cada tipo de exclusão;
- estado pendente e erro de exclusão;
- estado vazio e mensagens de erro.

---

## 15. Rastreabilidade

- RF-01 a RF-05: fundação comum e layout.
- RF-06 a RF-11: formulários CRUD.
- RF-12 a RF-14: resumos e pagamentos.
- RF-15 a RF-20: confirmações destrutivas.
- RI-01 a RI-06 e RA-01 a RA-06: teclado, foco, fechamento e acessibilidade.
- RR-01 a RR-04: responsividade.
- RNF-01 a RNF-07: compatibilidade e qualidade.

Cada tarefa do futuro `plan.md` deverá citar os requisitos que cobre e incluir comando ou roteiro de verificação.

---

## 16. Gate de aprovação

Esta spec está pronta para revisão humana. A implementação não deve começar antes de:

1. aprovação explícita deste `about.md`;
2. criação do `plan.md` com a skill **spec-planner**;
3. aprovação explícita do plano.

Após a aprovação, alterar o status para **Aprovada para planejamento**.
