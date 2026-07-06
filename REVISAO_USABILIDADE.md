# 🧪 Revisão de Navegabilidade e Usabilidade — Gestão de Aluguel

> Teste end-to-end executado com **Playwright** cobrindo autenticação, CRUD de todas as
> entidades, dashboard, gestão de pagamentos, página `/crud`, responsividade mobile e
> acessibilidade.

- **Data do teste:** 06/07/2026
- **Ambiente:** Docker — frontend `http://localhost:3001`, backend `http://localhost:8080`, Postgres `:5432`
- **Stack:** Next.js 14 (App Router) + Spring Boot 4 / Java 25 + PostgreSQL 16

### Nota metodológica
Foi cadastrado um usuário real (`qa.usabilidade@teste.com`) e criados **1 terreno + 2 salas** pela UI.
Como o **cadastro de Locatário e de Contrato está quebrado no backend** (ver bugs críticos),
foi necessário **semear 1 locatário e 1 contrato via SQL** para conseguir testar o Dashboard e a
gestão de pagamentos.

---

## ✅ Resultado por módulo

| Módulo | Criar | Editar | Excluir | Observação |
|---|:---:|:---:|:---:|---|
| **Autenticação** | ✅ | — | ✅ logout | Registro, login, logout, proteção de rota e erro de credencial: **tudo OK** |
| **Terrenos** | ✅ | ✅ | ✅ | CRUD 100% funcional. Autofill de CEP excelente |
| **Salas** | ✅ | ✅ | ✅* | CRUD funcional (*exclusão validada no mesmo mecanismo dos terrenos) |
| **Locatários** | ❌ **500** | ❌ **500** | — | **Quebrado** — bug `jsonb documentos` |
| **Contratos** | ❌ **400** | ❌ | (só leitura) | **Quebrado** — bug `emDia` (primitivo) |
| **Pagamentos** (Dashboard) | ✅ | ✅ | ✅ | Registrar/editar/excluir: **tudo OK**, ótima UX |

> **Impacto:** o fluxo-núcleo do sistema (**Locatário → Contrato → Cobranças**) está
> **inutilizável pela interface**. Apenas Terrenos, Salas e Pagamentos funcionam ponta a ponta.

---

## 🔴 Bugs críticos (bloqueadores)

### BUG-1 — Cadastro/edição de Locatário retorna HTTP 500
- **Onde:** `src/main/java/com/felicioecavalaro/gestao_aluguel/domain/model/Locatario.java:104-105`
- **Causa:** campo `String documentos` mapeado para coluna `jsonb` sem type handler.
  No Hibernate 6 / Spring Boot 4 o driver rejeita com
  `ERROR: column "documentos" is of type jsonb but expression is of type character varying` (SQLState `42804`).
- **Reproduz:** `POST /api/locatarios` e `PUT /api/locatarios/{id}` → **500**.
- **Também afeta:** `Fiador.java:89-90` (mesmo mapeamento) — logo, contrato **com fiador** também quebraria.
- **Correção sugerida:**
  ```java
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "documentos", columnDefinition = "jsonb")
  private String documentos;
  ```
  (alternativa: trocar a coluna para `text`).

### BUG-2 — Cadastro de Contrato retorna HTTP 400
- **Onde:** `src/main/java/com/felicioecavalaro/gestao_aluguel/controller/ContratoController.java:39`
  e `domain/model/Contrato.java:105`.
- **Causa:** o `POST` faz *bind* direto na **entidade** `Contrato`, que possui o primitivo
  `private boolean emDia`. O frontend não envia esse campo, e o Jackson falha com
  `Cannot map null into type boolean (through reference chain: Contrato["emDia"])`.
- **Detalhe:** existe um arquivo `ContratoRequestDTO.java` **vazio** na raiz do projeto — o DTO foi
  planejado mas nunca implementado; a controller ainda usa a entidade.
- **Correção sugerida:** criar e usar um `ContratoRequestDTO` (não expor a entidade no `@RequestBody`);
  ou trocar `boolean emDia` → `Boolean emDia` / anotar com `@JsonIgnore` se for campo derivado.

---

## 🟠 Achados de usabilidade

### Alta severidade
1. **Erros de validação aparecem ATRÁS do modal.** Ao submeter um locatário com CPF inválido,
   a mensagem “CPF inválido” é renderizada no nível da página, **encoberta pelo overlay do modal** —
   o usuário não vê o motivo da falha. Deveria ser renderizada **dentro** do modal (como já ocorre,
   corretamente, no modal de Pagamentos).
2. **Mensagens de erro genéricas demais.** Em falhas de servidor aparece
   *“Ocorreu um erro inesperado”* / *“Não foi possível concluir a operação. Verifique os dados”*,
   sem indicar campo ou causa, e sem destacar o campo problemático.
3. **Página `/crud` órfã e inconsistente.** É uma segunda interface de terrenos:
   - **sem menu de navegação** (só acessível digitando a URL);
   - **design diferente** do restante do app;
   - **expõe a URL da API** ao usuário (“API base: http://localhost:8080”);
   - mostra **campos com borda vermelha de erro antes de qualquer interação**;
   - **exclui sem confirmação** (segundo o código).

   → Recomendação: **remover** essa página.

### Média severidade
4. **Sala em “Manutenção” aparece como opção de contrato.** No `select` de Sala do formulário de
   contrato, uma sala com status `MANUTENCAO` é oferecida normalmente. Deveria listar apenas salas disponíveis.
5. **Tecla `Escape` não fecha os modais.** Só fecham no “×” ou clicando fora — quebra expectativa padrão.
6. **Mensagem confusa em Pagamentos.** Para contrato com início futuro, “Adicionar pagamento” retorna
   *“Todos os pagamentos do contrato ate o mes atual ja foram registrados”* — enganosa (não há pagamento
   algum) e **sem acentuação** (“ate”, “ja”).
7. **Métrica “Salas para alugar” ambígua.** Conta apenas salas `DISPONIVEL`, mas o rótulo não deixa claro.
   No mobile o texto do card trunca (“TERRENOS CADASTRAD…”).

### Baixa severidade
8. **Formatação decimal inconsistente:** metragem “850,50” é exibida como “850,5”; ao reabrir a edição
   aparece “800” (sem casas decimais). Padronizar em 2 casas.
9. **`favicon.ico` retorna 404** em todas as páginas (poluição no console do navegador).

---

## ♿ Acessibilidade

- **Nenhum dos 11 inputs dos formulários tem label associado (0/11).** Os “labels” visíveis são
  `<div>`/`<span>` (não `<label htmlFor>` nem `aria-label`), então leitores de tela anunciam os campos
  **sem nome** — falha **WCAG 1.3.1 / 4.1.2**. É o achado de acessibilidade mais impactante.
- **Campos obrigatórios** usam apenas asterisco visual — faltam `aria-required="true"`.
- **Cabeçalhos de tabela ordenáveis** não têm `aria-sort`; o indicador é só a seta unicode `↑↓`.
- **Status por cor + texto** (badges): o texto ajuda, mas convém garantir contraste adequado nas cores.

---

## 📱 Responsividade (viewport 390px)

- **Overflow horizontal confirmado:** o documento fica com **910px de largura num viewport de 390px**,
  obrigando rolagem lateral. Causa: as **tabelas (~865px) não têm wrapper `overflow-x:auto`** nem
  layout alternativo em cards no mobile.
- **Navegação não colapsa** (sem menu “hambúrguer”): em telas estreitas os itens ficam apertados/cortados.
- ✅ **Ponto positivo:** os **modais de formulário são responsivos** — campos empilham e há scroll interno.

---

## 👍 Pontos fortes

- **Terrenos, Salas e o fluxo de Pagamentos funcionam muito bem**, com boa formatação
  (R$ 2.500,00, datas, m²) e badges de status.
- **Autofill de CEP** (Av. Paulista → bairro / cidade / UF) é excelente.
- **Formulário de pagamento inteligente:** desabilita meses futuros, pré-preenche o valor do aluguel e a
  data de hoje, e avança automaticamente para o próximo mês em aberto.
- **Confirmações de exclusão bem escritas**
  (ex.: *“Excluir o pagamento de Janeiro/2026? Esta ação não pode ser desfeita.”*).
- **Autenticação sólida:** proteção de rota, logout e mensagens de credencial corretas.

---

## 🎯 Recomendações priorizadas

| Prioridade | Ação |
|---|---|
| **P0 — Desbloquear o fluxo** | Corrigir os 3 bugs de backend: `documentos` jsonb em **Locatário** e **Fiador**; `emDia` em **Contrato** via DTO. Sem isso não é possível criar locatários nem contratos. |
| **P1 — Usabilidade** | Mover alertas de erro para dentro do modal; mensagens de erro específicas por campo; **remover a página `/crud`**; filtrar salas indisponíveis no formulário de contrato. |
| **P2 — Acessibilidade** | Associar `<label htmlFor>` a todos os inputs; adicionar `aria-required` e `aria-sort`; fechar modal com `Escape`. |
| **P3 — Responsividade e polimento** | Envolver tabelas em container com scroll horizontal (ou cards no mobile); menu mobile; padronizar decimais; corrigir acentuação das mensagens; corrigir favicon 404. |

---

## Anexos — evidências (screenshots capturados durante o teste)

Arquivos gerados na raiz do projeto:

- `01-dashboard-vazio.png` — Dashboard sem dados (usuário recém-criado)
- `02-locatario-cpf-invalido.png` — Erro “CPF inválido” encoberto atrás do modal
- `03-dashboard-com-dados.png` — Dashboard populado (indicadores + vencimentos)
- `04-crud-page.png` — Página `/crud` órfã (validação vermelha prematura, URL da API exposta)
- `05-mobile-home.png` — Home no mobile (overflow horizontal / cards truncados)
- `06-mobile-modal.png` — Modal de formulário no mobile (responsivo, OK)
