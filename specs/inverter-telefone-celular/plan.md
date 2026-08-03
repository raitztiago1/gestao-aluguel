# Plan de implementação — Inverter Telefone ↔ Celular

Estou usando a skill **spec-planner** para **quebrar a spec em tarefas atômicas e ordenadas**.

Data: 2026-08-03

Objetivo curto: tornar `celular` obrigatório (frontend + backend), mover `celular` antes de `telefone` nos formulários, garantir compatibilidade e rollout seguro.

Ordem geral (dependências): T1 → (T2a,T2b,T2c,T3,T4a,T4b) → T6 → T7 → T8 → T9 → T10

Tarefas atômicas

- T1 — Inventariar locais afetados (1.5h)
  - Descrição: localizar todos os formulários, componentes e endpoints que exibem/aceitam `telefone` e `celular`.
  - Onde olhar: `frontend/app/**/*`, `frontend/components/**/*`, `src/main/java/**/dto/**`, `controller/`, `service/`.
  - Entregável: lista de caminhos de arquivos e endpoints em `specs/inverter-telefone-celular/inventario.md`.
  - Verificação: arquivo `inventario.md` criado com >=1 exemplo por entidade.

- T2a — Atualizar frontend: Locatários (1.5h)
  - Mudar ordem: `celular` antes de `telefone`.
  - Tornar campo obrigatório (HTML + validação do formulário).
  - Aplicar máscara de celular (ex: `(99) 9 9999-9999`) e feedback inline.
  - Arquivos alvo sugeridos: `frontend/app/locatarios/**`.
  - Verificação: formulário bloqueia submissão sem celular; `npm run lint` sem erros.

- T2b — Atualizar frontend: Locadores (1.5h)
  - Mesmo que T2a, para `frontend/app/locadores/**`.

- T2c — Atualizar frontend: Contratos (1.5h)
  - Mesmo que T2a, para formulários relacionados a contratos.

- T3 — Criar/ajustar componente/utility de input de telefone (2h)
  - Implementar componente reutilizável `PhoneInput` com máscara e normalização para E.164.
  - Exportar validação utilitária (regex + normalizer) em `frontend/lib/`.
  - Verificação: story/example e testes unitários simples (se existir infra).

- T4a — Atualizar backend: DTOs de request (1.5h)
  - Adicionar validação `@NotBlank` / `@Pattern` (ou equivalente) em DTOs para `celular`.
  - Normalizar entrada (remover formatação) na camada de conversão DTO→entity.
  - Arquivos alvo: `src/main/java/.../dto/*`.
  - Verificação: mvnw compile + testes unitários dos DTOs.

- T4b — Atualizar backend: regras de serviço / controller (1.5h)
  - Garantir que serviços que dependem de contato falhem com 400 quando `celular` ausente.
  - Implementar header de compatibilidade `X-Allow-legacy-no-celular` (aceitar temporariamente ausência).
  - Verificação: integração com MockMvc que demonstra header habilitando comportamento legado.

- T5 — Normalização E.164 no backend (1.5h)
  - Implementar utilitário para converter números brasileiros para E.164 antes de persistir.
  - Reusar no DTO conversion / service.
  - Verificação: testes unitários confirmando +55119... formato.

- T6 — Banco de dados / Flyway migration (1h)
  - Verificar constraints atuais.
  - Se `telefone` estiver NOT NULL, criar migration para torná-lo NULLABLE.
  - NOTA: evitar tornar `celular` NOT NULL agora; validar apenas na aplicação.
  - Verificação: `mvnw.cmd -DskipTests=true clean compile` e inspeção da migration gerada em `src/main/resources/db/migration`.

- T7 — Compat-layer e monitoramento (1.5h)
  - Implementar suporte no backend ao header `X-Allow-legacy-no-celular: true` que permite requests sem `celular` retornando warnings.
  - Adicionar métrica/contador para 400s relacionados a `celular` ausente.
  - Verificação: endpoint retorna 200 com header, 400 sem header.

- T8 — Testes automatizados (2h)
  - Unit tests: DTO validation, normalizer, PhoneInput logic.
  - Integration tests: endpoints de criação/edição retornando 400 quando aplicável.
  - Verificação: `.\mvnw.cmd test` e `cd frontend; npm run lint` (e `npm run build` se necessário).

- T9 — Documentação e changelog (1h)
  - Atualizar docs de API/DTOs e changelog com instruções para integradores.
  - Incluir header `X-Allow-legacy-no-celular` na doc.
  - Verificação: `specs/inverter-telefone-celular/docs.md` criado.

- T10 — Rollout e observabilidade (2h)
  - Definir janela de rollout (gradual recomendado).
  - Criar dashboards/alertas (erros 400 por endpoint, taxa de cadastros sem celular).
  - Plano de comunicação para integradores.
  - Verificação: plano aprovado por Produto/Operações e dashboards mínimos criados (instruções).

Estimates totais (somatório): ~16–17 horas (dependendo de backfill e migrações).

Critérios de aceitação do plano
- Todas as tarefas marcadas como "done" com evidência (PRs/tests/docs).
- Testes backend e frontend relevantes passam.
- Rollout plan aprovado por Produto/Operações.

Próximo passo proposto: confirmar estratégia de rollout (gradual vs imediato). Posso começar pela T1 (inventariar) se você aprovar.

