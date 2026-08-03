# Inverter obrigatoriedade e posição: Telefone ↔ Celular

Data: 2026-08-03

Estou usando a skill **idea-refine** para **refinar a ideia de inverter obrigatoriedade e posição de telefone e celular**.

## Reformulação (Como Poderíamos...)
Como poderíamos tornar o campo "celular" obrigatório e o campo "telefone" opcional (trocando também sua ordem/posição nos formulários e nas validações de negócio) de forma segura, compatível com os dados existentes e com mínima fricção para usuários e integrações?

## Problema
Atualmente o campo `telefone` está marcado como obrigatório e `celular` como opcional. No uso atual, telefones fixos são menos usados que celulares, o que causa atrito no cadastro e dados incompletos/irrelevantes.

## Impacto / Por que resolver
- Melhora a qualidade dos contatos (mais celulares preenchidos).
- Reduz fricção ao cadastrar (menos campos obrigatórios pouco usados).
- Melhora comunicação (SMS/WhatsApp) que depende de celular.

## Stakeholders
- Produto (priorização, copy/UX)
- Backend (validações, DTOs, serviços, banco, migração)
- Frontend (UI, ordem dos campos, validações do formulário)
- QA (testes funcionais e integração)
- Operações (rollout, monitoramento)

## Restrições e riscos
- Backwards compatibility de APIs e integrações externas — consumidores esperam `telefone` obrigatório?
- Dados existentes: registros sem `celular` devem ser tratados (fallback, banner de atualização).
- Requisitos legais ou contratos que exigem telefone fixo (se houver).
- Possível necessidade de migração de dados ou scripts de comunicação.

## Alternativas consideradas
1. Tornar ambos opcionais e pedir celular somente quando necessário (menos disruptivo).
2. Tornar campo `celular` obrigatório apenas para novos cadastros (gradual rollout).
3. Validar formato do celular e sugerir preenchimento via banner em vez de obrigatoriedade.

## Critérios de aceite (pronto quando)
1. Nas telas de cadastro/edição, `celular` aparece antes de `telefone` e é obrigatório no frontend.
2. Backend valida e rejeita requests sem `celular` (HTTP 400) quando aplicável.
3. Documentação da API atualizada (contratos/dto) refletindo a obrigatoriedade.
4. Estratégia para registros existentes definida (migração, comunicados ou atualização on-first-login).
5. Testes automatizados cobrindo validações e UI.

## Riscos de implantação e mitigação
- Risco: integrações quebram → Mitigação: criar compat-layer que aceita ausência de `celular` e retorna erros gradualmente + comunicação aos integradores.
- Risco: massa de dados sem celular → Mitigação: campanha de atualização e/ou permitir roll-out gradual (somente novos cadastros inicialmente).

## Próximos passos recomendados
1. Criar spec detalhada em `specs/inverter-telefone-celular/about.md` com campos afetados, telas, endpoints e exemplos de payload.
2. Definir estratégia de rollout (imediato vs. gradual) com Produto e Operações.
3. Planejar tarefas atômicas (frontend, backend, migração, QA).
4. Implementar testes de contrato e integração antes do deploy.

