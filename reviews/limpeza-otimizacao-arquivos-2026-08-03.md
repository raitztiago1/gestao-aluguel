# Spec Compliance — limpeza e otimização de arquivos

**Data:** 2026-08-03  
**Spec:** [specs/limpeza-otimizacao-arquivos/about.md](../specs/limpeza-otimizacao-arquivos/about.md)  
**Escopo:** varredura complementar de arquivos e código não utilizados

## Resultado

A varredura encontrou poucos resíduos comprovadamente órfãos. As remoções foram limitadas a itens sem consumidores e artefatos regeneráveis, preservando migrations Flyway, arquivos de domínio do roadmap, documentação histórica, configurações locais e dependências necessárias.

## Removido

- `frontend/tsconfig.tsbuildinfo` — cache TypeScript rastreado pelo Git.
- `HELP.md` — arquivo padrão do Spring Initializr, não rastreado e já ignorado.
- `scripts/install-spec-driven-kit.py` — instalador one-shot com caminho local hardcoded e sem referências.
- `CobrancaRepository.findByContratoIdAndAnoAndMes` — método substituído pela consulta tipada e sem chamadas.
- `TerrenoRepository.findByTipo` — método sem chamadas.
- Helpers/reexports sem consumidores em `frontend/app/lib/format.ts`:
  - `formatAddressShort`
  - `formatCepDisplay`
  - reexport de `labelStatusSala`
- `getApiBaseUrl` em `frontend/app/lib/api.ts` — export sem consumidores.

## Preservado intencionalmente

- Todas as migrations Flyway, inclusive `V2__telefone_nullable.sql` e `V7__cobrancas_tipadas_despesas_opcionais.sql`.
- `TerrenoDTO`, `TipoGarantia`, entidades e repositories de Fiador/Caução/Configuração do Locador, conforme exclusões e RN-01 da spec.
- `TestController`, serviços agendados, endpoints REST cobertos por testes e documentação SDD/histórica.
- `.vscode/`, `.github/`, `frontend/node_modules/`, `frontend/.next/` e `target/`.
  - `.next/` e `target/` estavam em uso pelos servidores de desenvolvimento.
  - `node_modules/` é necessário para desenvolvimento e pode ser reinstalado, mas sua remoção não agrega higiene ao repositório porque já está ignorado.

## Prevenção

O `.gitignore` passou a cobrir:

- `tmp/`, `.agents/`, `backups/`
- `.env*.local`
- `frontend/out/`, `frontend/.turbo/`, `.vercel/`
- `*.log`, `npm-debug.log*`
- `Thumbs.db`, `.DS_Store`

## Compliance com a spec

- RF-01: atendido — cache rastreado removido; nenhum novo lixo confirmado na raiz.
- RF-02: atendido — `*.tsbuildinfo` continua ignorado e o arquivo antigo saiu do índice.
- RF-03 a RF-05: preservados — scripts, docs e README mantidos.
- RF-06 a RF-10: preservados — nenhuma migration foi removida ou alterada nesta limpeza.
- RN-01: atendido — stubs de domínio e repositories do roadmap mantidos.
- RN-03: atendido — Flyway permanece como fonte do schema.
- RN-07: atendido — `TestController` e skill de segurança mantidos.

## Evidências de verificação

- `.\mvnw.cmd test` — **208 testes, 0 falhas, BUILD SUCCESS**.
- `npm run lint` — sucesso; dois warnings preexistentes em `AppHeader.tsx` e `layout.tsx`.
- `npx tsc --noEmit --incremental false` — sucesso.
- Busca global pelos símbolos removidos — nenhuma referência de código restante.
- `git diff --check` apontou uma linha em branco adicional no EOF de `ContratoRequestDTO.java`, alteração anterior e fora desta limpeza.

## Pendências não bloqueantes

- `scripts/dev/check-flyway-history.sql` e a seção correspondente do README ainda descrevem apenas as versões antigas; devem ser atualizados para V2 e V7 em uma tarefa de documentação/migrations.
- `frontend/.next/` e `target/` podem ser apagados quando os servidores forem encerrados para recuperar espaço, sem impacto no repositório.

## Conclusão

**Aprovado para o escopo de limpeza segura.** Não foi encontrado motivo técnico para remover migrations ou arquivos de roadmap. As remoções efetuadas não alteram comportamento público e passaram nos gates disponíveis.
