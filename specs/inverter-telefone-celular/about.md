# Spec: Inverter obrigatoriedade e posição — Telefone ↔ Celular

Estou usando a skill **spec-writer** para **transformar a ideia aprovada em uma spec técnica**.

Data: 2026-08-03

## Resumo
Trocar a obrigatoriedade e a ordem dos campos `telefone` e `celular` nas telas de cadastro/edição e nas validações de backend:
- `celular` passa a ser obrigatório (frontend + backend) e aparece antes de `telefone` nos formulários.
- `telefone` passa a ser opcional.

Objetivo: reduzir fricção no cadastro, aumentar a taxa de celulares válidos e alinhar integrações com o uso atual de contatos móveis.

## Escopo
Inclui:
- Frontend: páginas de criação/edição de Locatário, Locador, Contrato e quaisquer formulários onde `telefone` e `celular` aparecem.
- Backend: DTOs de request, validações (service/controller), regras de negócio e contratos de API.
- Banco de dados: revisar constraints, índices e possíveis migrações (se houver constraint NOT NULL).
- Documentação: API (README/DTOs), changelog e notas para integradores.
- QA: testes automatizados (backend unit/integration), testes manuais de fluxo e e2e básico.

Exclui:
- Sistemas externos (integrações de terceiros) — comunicaremos as mudanças e prepararemos compat-layer quando necessário.

## Requisitos funcionais (RF)
RF1 — UI: Em todas as telas de cadastro/edição, o campo `celular` aparece antes de `telefone` e é marcado como obrigatório.
RF2 — Frontend validation: Formulários não devem submeter sem um `celular` válido (regex + máscara).
RF3 — Backend validation: Endpoints que aceitam DTOs com contato devem retornar 400 quando `celular` ausente ou inválido.
RF4 — Backwards compatibility: API deve continuar aceitando requests sem `telefone` (já opcional) e aceitar requests sem `celular` somente durante a janela de rollout se ativada a flag de compatibilidade.
RF5 — Dados existentes: Definir política para registros sem `celular` (ver Migração/Rollout).

## Requisitos não-funcionais (RN)
RN1 — Mensagens em português (Brasil).
RN2 — Mudança não deve degradar performance visível; validações simples no backend.
RN3 — Cobertura de testes: novas validações cobertas por testes unitários e integração.

## UX / UI detalhes
- Componentes afetados (exemplos):
  - `frontend/app/locatarios/page.tsx` (form de cadastro/edição)
  - `frontend/app/locadores/page.tsx`
  - `frontend/app/contratos/...` (se houver formulário de criação/edição)
- Ordem dos campos: `celular` antes de `telefone`.
- Máscara e validação: usar máscara de celular nacional — ex: `(99) 9 9999-9999` e validar via regex E.164 normalization server-side.
- Labels e helper text: atualizar se necessário para explicar uso preferencial de celular.

## Backend: alterações técnicas
- Pacotes/paths prováveis:
  - `src/main/java/com/felicioecavalaro/gestao_aluguel/dto/` — atualizar DTOs que representam requests.
  - `controller/` — garantir validações na entrada (ControllerAdvice existente).
  - `service/` — regras que dependem de contato.
  - `repository/` — se houver constraint NOT NULL em colunas `celular`/`telefone`.
- Validação:
  - Adicionar @NotBlank / @Pattern (ou equivalente) em DTOs para `celular`.
  - Normalizar celular para E.164 antes de persistir.
- API contract:
  - Atualizar exemplos de payload em documentação.
  - Versão: preferir não quebrar versão — seguir compat-layer durante rollout.

## Banco de dados / Migração
- Verificar se colunas `celular` ou `telefone` têm NOT NULL constraints:
  - Se `celular` atualmente for NULLABLE, não é necessária migração imediata.
  - Se `telefone` for NOT NULL, deverá ser alterada para NULLABLE (Flyway migration).
- Migração proposta (opcional, gradativa):
 1. Criar migration para tornar `telefone` NULLABLE (se necessário).
 2. Não tornar `celular` NOT NULL imediatamente — introduzir validação apenas na aplicação para novos cadastros.
 3. Opcional: script de backfill para preencher `celular` quando possível (a partir de fontes alternativas) ou campanha de atualização.

## Rollout e compatibilidade
Opções de rollout:
1. Gradual (recomendado): aplicar obrigatoriedade apenas para novos cadastros; manter compat-layer em API que aceita ausência de `celular` por um período.
2. Imediato (mais disruptivo): aplicar validações frontend e backend para todos requests; comunicar integradores 7-14 dias antes.

Compat-layer:
- Backend aceita requests sem `celular` se header `X-Allow-legacy-no-celular: true` estiver presente (para integradores aprovados), retornando warnings no response body.
- Monitorar erros 400 por endpoint e criar dashboards/alertas.

## Testes e critérios de aceite (QA)
- Unit tests:
  - DTO validation: falha quando `celular` ausente/inválido.
  - Service flows que dependem de contato adaptados.
- Integration tests:
  - Endpoints de criação/edição retornam 400 quando `celular` inválido.
- Frontend:
  - Formulários bloqueiam submissão sem `celular`.
  - Ordem dos campos atualizada visualmente.
- Manual:
  - Testar criação/edição de Locatário/Locador/Contrato.
  - Testar comportamento com `X-Allow-legacy-no-celular` header.

Comandos de verificação:
- Backend tests (rodar na raiz):
  - `.\mvnw.cmd "-Dtest=ContratoServiceTest" test` (exemplo)
  - `.\mvnw.cmd test` (suite relevante)
- Frontend:
  - `cd frontend; npm run lint`
  - `cd frontend; npm run build` (opcional para ver warnings)

## Exemplo de contratos (antes / depois)
Antes (exemplo DTO atual):
```json
{
  "nome": "João",
  "telefone": "(11) 2222-3333",
  "celular": ""
}
```

Depois (válido):
```json
{
  "nome": "João",
  "celular": "+5511998765432",
  "telefone": "(11) 2222-3333"
}
```

## Checklist para revisão humana (Gate)
1. Produto aprova abordagem e rollout (imediato vs gradual).
2. Operações confirma plano de comunicação e monitoramento.
3. QA aprova a lista de testes e evidencia.
4. Documentação atualizada e changelog preparado.

## Tarefas sugeridas (para plan.md)
T1 — Inventariar todos os formulários onde os campos aparecem.
T2 — Atualizar frontend: ordem dos campos, máscara e validação.
T3 — Atualizar backend DTOs e validações.
T4 — Criar/ajustar migration se necessário.
T5 — Implementar compat-layer e header de rollout.
T6 — Adicionar testes unit e integration.
T7 — Atualizar docs e notificar integradores.

## Aceite final
Pronto quando todos os RF e critérios de QA estão verdes, documentação atualizada e rollout plan aprovado.

