# Validação da spec: Padronização dos modais

**Data:** 2026-08-03  
**Spec:** `specs/padronizacao-modais-layout-nova-sala/about.md`  
**Plano:** `specs/padronizacao-modais-layout-nova-sala/plan.md`  
**Resultado:** Implementação conforme por inspeção estática; aprovação para PR condicionada ao smoke test autenticado  

---

## 1. Resumo

A fundação compartilhada e todos os consumidores previstos foram implementados. As revisões por tarefa e a revisão ampla final não possuem achados acionáveis restantes.

Evidências automatizadas:

- `npm run lint`: exit code `0`, com dois avisos preexistentes fora do escopo.
- `npm run build`: exit code `0`.
- `rg "window\.confirm" frontend/app`: nenhum match.
- `rg "modal-backdrop" frontend/app`: nenhum match.
- `git diff --check` restrito aos arquivos da feature: exit code `0`.
- IDE: nenhum erro de lint nos arquivos alterados.

Limitação:

- O roteiro manual autenticado não foi concluído. A aplicação redireciona para `/login` e não há credencial de teste documentada.
- Uma tentativa inicial de smoke encontrou `.next` inconsistente porque um servidor de desenvolvimento antigo concorria com o build. Sem o processo concorrente, o build foi refeito com sucesso e o servidor de produção iniciou normalmente; o bloqueio restante foi apenas autenticação.

---

## 2. Requisitos funcionais

### RF-01 a RF-05 — Fundação

**Status:** Conforme por código e build.

- `Modal.tsx` centraliza `<dialog>`, título, descrição, conteúdo, ações, tamanhos, fechamento, backdrop e estado bloqueado.
- Cabeçalho e ações ficam fora da região rolável.
- Tamanhos `small`, `default` e `large` estão implementados.

### RF-06 a RF-11 — Formulários CRUD

**Status:** Conforme por inspeção; fluxo runtime pendente.

- Sala, terreno, locatário e contrato usam `Modal`.
- Seções visuais foram aplicadas sem alteração intencional de payload ou endpoints.
- `ErrorAlert` permanece dentro dos formulários.
- Rotinas de reset são chamadas no fechamento.
- O PDF de contrato agora é limpo e remontado ao reabrir.
- A garantia fiador/caução citada em RF-09 já não existia no frontend antes desta feature; backend e regras existentes não foram alterados. A lacuna é preexistente e não foi expandida para evitar mudança de domínio fora do escopo.

### RF-12 a RF-14 — Resumos e pagamentos

**Status:** Conforme por inspeção; fluxo runtime pendente.

- Os quatro resumos usam a variante padrão compartilhada.
- Pagamentos usam tamanho amplo, estado de erro próprio e bloqueio durante salvamento.
- Tabelas permanecem contidas em `.table-scroll`.
- Ações concorrentes de editar/excluir ficam desabilitadas durante salvamento.

### RF-15 a RF-20 — Confirmações

**Status:** Conforme por código; interação runtime pendente.

- Todas as cinco confirmações nativas foram substituídas por `ConfirmDialog`.
- A confirmação usa `alertdialog`, mensagem associada e foco inicial em “Cancelar”.
- Backdrop não cancela nem confirma.
- Estado pendente bloqueia fechamento e requisições duplicadas.
- Erros são exibidos dentro do diálogo.
- Exclusão de pagamento mantém o diálogo inferior aberto.

---

## 3. Interação, visual e acessibilidade

### RI-01 a RI-06

**Status:** Conforme por implementação; validação em navegador autenticado pendente.

- Foco inicial configurável.
- Foco devolvido ao acionador.
- `cancel`/`Escape` prevenido quando bloqueado.
- Formulários e confirmações não fecham pelo backdrop; resumos fecham.
- Scroll lock usa contador para diálogos empilhados.

### RV-01 a RV-06

**Status:** Conforme por CSS e inspeção.

- Linguagem visual comum baseada no modal de sala.
- Seções, ações, erro, foco, disabled e estilo destrutivo padronizados.
- `prefers-reduced-motion` respeitado.

### RA-01 a RA-06

**Status:** Conforme por semântica; anúncio real em leitor de tela pendente.

- `<dialog>` nativo com nome e descrição associados.
- `alertdialog` para confirmação.
- Fundo inerte fornecido por `showModal()`.
- Estados de erro e andamento possuem semântica anunciável.

### RR-01 a RR-04

**Status:** Conforme por CSS/build; dispositivos reais pendentes.

- Largura e altura limitadas por viewport/dynamic viewport.
- Grids colapsam em telas estreitas.
- Em pouca altura, somente o conteúdo rola; cabeçalho e ações permanecem disponíveis.
- Ações compactam e quebram sem recorte.

### RNF-01 a RNF-07

**Status:** Conforme.

- Stack atual preservado e nenhuma dependência adicionada.
- Componentes não importam tipos ou serviços de domínio.
- Idioma permanece PT-BR.
- Lint e build verdes.

---

## 4. Critérios de aceite

- CA-01 a CA-08: estrutura, estados e callbacks conformes por inspeção; execução autenticada pendente.
- CA-09: semântica e top layer nativas implementadas; ciclo real de teclado pendente.
- CA-10: regras responsivas implementadas; viewport móvel real pendente.
- CA-11: payloads e endpoints foram preservados por inspeção; regressão funcional runtime pendente.

---

## 5. Qualidade e revisões

Cada tarefa de T01 a T09 recebeu:

1. implementação isolada;
2. revisão de compliance e qualidade;
3. correção dos achados;
4. revalidação.

A revisão ampla final foi aprovada sem achados restantes após corrigir o comportamento em viewports de pouca altura.

O `git diff --check` global ainda acusa uma linha vazia no fim de `ContratoRequestDTO.java`. Esse arquivo já estava alterado por outra feature e não integra o escopo dos modais. O diff restrito à feature está limpo.

---

## 6. Pendência para aprovação final

Executar com uma conta de teste autenticada:

1. criar, editar, cancelar e excluir sala, terreno, locatário e contrato;
2. abrir os quatro resumos da home;
3. adicionar, editar, cancelar e excluir pagamento;
4. testar `Tab`, `Shift+Tab`, `Escape`, backdrop e retorno de foco;
5. testar confirmação empilhada de pagamento;
6. repetir os fluxos principais em viewport móvel e pouca altura.

Até essa evidência existir, a implementação está **tecnicamente concluída e estaticamente conforme**, mas o gate para PR permanece **condicionado ao smoke manual autenticado**.
