# Padronização dos modais pelo layout de “Nova sala”

**Status:** Aprovada para spec  
**Data:** 2026-08-03  
**Aprovada em:** 2026-08-03  
**Origem:** Idea-refine — usar o modal “Nova sala” como referência para reestilizar todos os modais do sistema  
**Próximo:** `specs/padronizacao-modais-layout-nova-sala/about.md` via **spec-writer**

---

## Como Poderíamos…?

> **Como poderíamos usar o modal “Nova sala” como referência visual para oferecer uma experiência consistente, responsiva e acessível em todos os modais do sistema, preservando layouts adequados para formulários, listagens e confirmações?**

---

## Problema

O sistema possui uma linguagem visual parcialmente compartilhada por CSS, mas cada modal é montado diretamente dentro de sua página. Não existe um componente reutilizável que concentre estrutura, comportamento e acessibilidade.

O inventário atual identificou:

- 8 overlays customizados em 5 páginas:
  - sala;
  - terreno;
  - locatário;
  - contrato;
  - quatro resumos da home;
  - gerenciamento de pagamentos.
- 5 fluxos de exclusão baseados em `window.confirm`.
- Formulários com organizações diferentes: alguns são planos, enquanto “Nova sala” já utiliza seções visuais.
- Comportamentos repetidos para fechar, tratar `Escape`, limpar formulário e exibir erros.
- Ausência de recursos importantes de diálogo, como semântica ARIA, gerenciamento de foco e bloqueio de foco dentro do modal.

Isso gera inconsistência visual, duplicação e maior risco de divergência quando um modal é alterado isoladamente.

---

## Decisões alinhadas

1. A iniciativa cobrirá todos os overlays existentes e substituirá as confirmações nativas de exclusão.
2. O resultado será visual e estrutural: haverá componente reutilizável, comportamento comum e acessibilidade.
3. O modal “Nova sala” será a base da linguagem visual, não um molde rígido para todos os conteúdos.
4. Serão previstas variantes adequadas para formulário, listagem e confirmação.
5. A migração será incremental: primeiro a fundação compartilhada, depois os modais agrupados por tipo, com validação a cada etapa.

---

## Conceito proposto

### Fundação compartilhada

Criar uma abstração única de diálogo responsável por:

- backdrop e painel;
- cabeçalho com título, descrição opcional e ação de fechar;
- corpo rolável;
- rodapé opcional para ações;
- tamanhos adequados ao conteúdo;
- fechamento por `Escape` e, quando permitido, pelo backdrop;
- semântica de diálogo e associação entre título e descrição;
- foco inicial, retenção do foco dentro do modal e devolução do foco ao elemento que o abriu;
- bloqueio do scroll da página enquanto aberto;
- comportamento responsivo.

Essa fundação deve permitir composição de conteúdo sem conhecer as regras de negócio de sala, terreno, contrato ou pagamento.

### Linguagem visual de “Nova sala”

Os demais modais devem herdar:

- hierarquia clara entre título, descrição e conteúdo;
- agrupamento de campos por seções;
- espaçamento e bordas consistentes;
- mensagens de erro no contexto do modal;
- ações primária e secundária previsíveis;
- área de conteúdo rolável sem perder acesso ao cabeçalho e às ações;
- apresentação limpa de informações auxiliares, status e toggles.

### Variantes

**Formulário**

- Aplicável a sala, terreno, locatário e contrato.
- Campos agrupados em seções semânticas.
- Ações de salvar e cancelar em posição consistente.
- Mantém particularidades de cada entidade, máscaras, endereço, status e despesas adicionais.

**Listagem e detalhes**

- Aplicável aos resumos da home e à gestão de pagamentos.
- Suporta tabelas, estados vazios, conteúdo largo e tamanho maior.
- Mantém scroll interno e legibilidade em telas menores.
- O formulário inline de pagamentos usa a mesma linguagem de seções e ações.

**Confirmação**

- Substitui `window.confirm` nas exclusões de sala, terreno, locatário, contrato e pagamento.
- Exibe claramente a entidade afetada e a irreversibilidade da ação.
- Diferencia visualmente a ação destrutiva.
- Oferece cancelar como alternativa segura e previsível.

---

## Alternativas consideradas

### Apenas alterar CSS

Manteria o JSX inline e aproximaria a aparência dos modais. Foi descartada como direção principal porque não resolve duplicação, acessibilidade nem divergências de comportamento.

### Copiar integralmente o modal “Nova sala”

Aplicaria a mesma estrutura a qualquer conteúdo. Foi descartada porque tabelas, pagamentos e confirmações têm necessidades diferentes de largura, rolagem e ações.

### Base comum com variantes

Escolhida. Preserva a identidade visual de “Nova sala”, centraliza comportamentos e permite especialização controlada por tipo de conteúdo.

---

## Escopo sugerido para a spec

### Dentro

- Componente compartilhado de diálogo e primitivas necessárias.
- Variantes de tamanho e composição para formulário, listagem e confirmação.
- Reestilização dos modais de sala, terreno, locatário e contrato.
- Reestilização dos resumos e do gerenciamento de pagamentos na home.
- Substituição das cinco confirmações nativas de exclusão.
- Padronização das seções internas, cabeçalhos, descrições, erros e ações.
- Responsividade e acessibilidade de teclado/foco.
- Preservação das validações e regras de negócio existentes.

### Fora, por enquanto

- Redesenho geral das páginas fora dos modais.
- Mudanças nas APIs ou regras de negócio do backend.
- Introdução de novos fluxos CRUD.
- Alteração da identidade visual global que não seja necessária para a consistência dos diálogos.
- Conversão do menu mobile ou de outros overlays não classificados como modal.

---

## Estratégia de entrega

1. Definir a fundação visual e comportamental do diálogo compartilhado.
2. Migrar os formulários CRUD, usando “Nova sala” como primeiro caso de referência.
3. Migrar os modais de resumo e o gerenciamento de pagamentos.
4. Substituir as confirmações nativas por diálogo de confirmação.
5. Validar responsividade, teclado, foco, fechamento e ausência de regressões em cada grupo.

---

## Riscos e cuidados

- Uma abstração rígida pode dificultar os casos especiais de contrato e pagamentos.
- Alterar o fechamento pelo backdrop pode causar perda acidental de formulários preenchidos; a spec deve definir a política para conteúdo com mudanças não salvas.
- Tabelas largas exigem tratamento responsivo sem tornar o diálogo ilegível.
- O gerenciamento de foco precisa funcionar com campos condicionais e componentes de máscara.
- A migração não deve modificar payloads, validações ou regras de salvamento existentes.
- A troca de `window.confirm` precisa preservar a proteção contra exclusões acidentais.

---

## Critérios de sucesso da ideia

- Todos os modais usam a mesma fundação visual e comportamental.
- Formulários, listagens e confirmações mantêm variantes adequadas ao conteúdo.
- As cinco confirmações nativas deixam de usar `window.confirm`.
- Usuários conseguem abrir, navegar, confirmar, cancelar e fechar os diálogos somente pelo teclado.
- O foco retorna ao controle que abriu o modal.
- Cabeçalho, conteúdo, erros e ações seguem uma hierarquia consistente.
- Os fluxos atuais continuam salvando, editando, excluindo e exibindo dados sem alteração de regra de negócio.
- Os diálogos permanecem utilizáveis em desktop e telas móveis.

---

## Próximo passo

1. O humano aprova este documento ou solicita ajustes.
2. Com aprovação explícita, alterar o status para **Aprovada para spec**.
3. Executar **spec-writer** para detalhar requisitos funcionais, regras de interação e critérios de aceite.

---

## Ponto a definir na spec

- Política de fechamento por backdrop quando houver alterações não salvas: bloquear, pedir confirmação ou manter o comportamento atual.
