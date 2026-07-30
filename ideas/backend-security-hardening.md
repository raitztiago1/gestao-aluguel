# Endurecimento de Segurança do Backend

**Status:** Aprovada — spec e plano em `specs/backend-security-hardening/`  
**Data:** 2026-07-30  
**Origem:** Auditoria de segurança pós-mapeamento de features

---

## Como Poderíamos…?

> **Como poderíamos elevar a postura de segurança da API Spring Boot para nível aceitável em produção, sem quebrar o frontend Next.js que consome JWT via Bearer?**

## Problema

- `/api/test/**` exposto sem autenticação (inclui INSERT via JDBC).
- Registro público aberto em `/api/auth/register`.
- Segredos (JWT, DB) em `application.properties` versionado.
- Testes em `security/` majoritariamente placeholders — não exercitam o filter chain.
- Upload PDF confia só em `Content-Type`; sem limite de tamanho.
- Headers HTTP de segurança ausentes.

## Escopo aprovado para spec

**Onda 1 + 2** (quick wins + headers + testes MockMvc). RBAC, refresh token e CSRF ficam fora.

## Próximo passo

→ `specs/backend-security-hardening/about.md`
