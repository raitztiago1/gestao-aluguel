# Plano de Testes do Projeto

## Objetivo

Criar cobertura inicial de testes unitários para as áreas principais (contratos, locatários, salas, terrenos e autenticação), validando serviços, controladores e regras de validação de domínio.

## Testes Entregues (60 testes no total)

### Contratos (10 testes)

- **ContratoServiceTest**: 7 testes
  - `findAll()` retorna lista
  - `findById()` com sucesso e erro
  - `create()` salva contrato
  - `update()` com sucesso e erro
  - `delete()` com sucesso e erro
- **ContratoControllerTest**: 3 testes
  - `list()` retorna todos os contratos
  - `get()` retorna contrato por ID
  - `create()` retorna novo contrato

### Locatários (10 testes)

- **LocatarioServiceTest**: 7 testes (mesmo padrão de contratos)
- **LocatarioControllerTest**: 3 testes

### Salas (10 testes)

- **SalaServiceTest**: 7 testes (mesmo padrão de contratos)
- **SalaControllerTest**: 3 testes

### Terrenos (15 testes)

- **TerrenoServiceTest**: 10 testes
  - CRUD básico (findAll, findById, create, update, delete)
  - Validações de domínio para terrenos COMERCIAL e RESIDENCIAL
  - Testes de erro (tipo nulo, vagas garagem obrigatória, campos inválidos)
- **TerrenoControllerTest**: 5 testes
  - list, get, create, update, delete

### Autenticação (14 testes)

- **AuthenticationServiceTest**: 10 testes
  - Login bem-sucedido
  - Login com usuário não encontrado
  - Login com senha incorreta
  - Registro bem-sucedido
  - Registro com email duplicado
  - Registro com senha fraca
  - Busca de usuário por email
  - Validações de entrada (null, campos vazios)

- **AuthControllerTest**: 4 testes
  - Login, register, forgot-password, reset-password

### Bootstrap (1 teste)

- **GestaoAluguelApplicationTests**: Teste de contexto Spring Boot

## Cobertura por Padrão

- **Testes Unitários de Serviço**: 31 testes (CRUD + validações)
- **Testes Unitários de Controlador**: 18 testes (requisições → serviço)
- **Teste de Integração**: 1 teste (contexto)

## Estatísticas

- Total: `60 testes`
- Falhas: `0`
- Erros: `0`
- Taxa de sucesso: `100%`

## Recomendações Futuras

1. **Testes de Integração com Banco de Dados**:
   - `@DataJpaTest` para repositórios JPA
   - Testes de migrations com Flyway

2. **Testes de Controlador com MockMvc**:
   - Validação de status HTTP
   - Serialização/desserialização JSON
   - Testes de segurança JWT

3. **Testes de Exceção**:
   - `GlobalExceptionHandler` com vários tipos de erro
   - Validação de mensagens de erro

4. **Testes de Segurança**:
   - `JwtFilter` e geração/validação de tokens
   - Autorizações baseadas em papel (role-based)

5. **Testes de Componente**:
   - `PasswordValidator` com múltiplas cidades
   - `InputSanitizer` com entradas maliciosas
   - `RateLimiter` com múltiplas tentativas

## Executar Todos os Testes

```bash
cd c:\dev\gestao-aluguel
.\mvnw.cmd test
```

## Executar Teste Específico

```bash
.\mvnw.cmd "-Dtest=ContratoServiceTest" test
.\mvnw.cmd "-Dtest=AuthenticationServiceTest,AuthControllerTest" test
```
