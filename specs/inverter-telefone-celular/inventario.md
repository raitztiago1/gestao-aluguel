# Inventário de locais afetados — Inverter Telefone ↔ Celular

Data: 2026-08-03

Estou executando T1: inventariar locais afetados para rollout imediato.

Arquivos identificados e ação recomendada / realizada:

- Frontend
  - `frontend/app/locatarios/page.tsx` — formulário de locatários: troquei ordem (celular antes de telefone), marquei `celular` como obrigatório (HTML) e atualizei payload para enviar `celular` sempre. (ALTERADO)

- Backend (modelos/controllers)
  - `src/main/java/com/felicioecavalaro/gestao_aluguel/domain/model/Locatario.java` — entidade: `telefone` alterado para nullable=true; `celular` marcado como obrigatório com validação `@NotBlank` e coluna definida como nullable=false. (ALTERADO)
  - `src/main/java/com/felicioecavalaro/gestao_aluguel/controller/LocatarioController.java` — adicionado `@Valid` em endpoints POST/PUT para validar presença de `celular`. (ALTERADO)
  - `src/main/java/com/felicioecavalaro/gestao_aluguel/domain/model/Fiador.java` — entidade: `telefone` alterado para nullable=true. (ALTERADO)

- Banco de dados / Migrations
  - `src/main/resources/db/migration/V1__init.sql` — esquema inicial mostra `telefone` NOT NULL para `locatario` e `fiador` (origem do requisito de migração).
  - `src/main/resources/db/migration/V2__telefone_nullable.sql` — nova migration para tornar `telefone` NULLABLE em `locatario` e `fiador`. (ADICIONADO)

Comentários / Observações
- Não foram encontradas páginas front-end óbvias para `locadores` ou `contratos` que contenham campos de contato no workspace atual; sugerir busca manual adicional se houver módulos externos.
- Seed/dev endpoints (ex: `TestController.createTestData`) inserem `telefone` atualmente — revisar se necessário para refletir nova regra.
- Próximo passo imediato: aplicar migration (executar Flyway) e compilar backend para garantir que validações funcionem; depois testar criação de locatário via UI e API.

