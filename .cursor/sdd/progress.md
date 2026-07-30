# Progresso Spec-Driven Development



Registro de execução de planos. Atualizar ao concluir cada task.



## Formato



```markdown

## [feature-slug] — YYYY-MM-DD



| Task | Status | Notas |

|------|--------|-------|

| T01  | done   | ...   |

```



---



## backend-security-hardening — 2026-07-30



| Task | Status | Notas |

|------|--------|-------|

| T01  | done   | `@Profile("dev")` no TestController; profile default `dev` |

| T02  | done   | Removido `permitAll` para `/api/test/**` |

| T03  | done   | Flag `app.auth.registration-enabled` + 403 em register |

| T04  | done   | Segredos externalizados; `application-prod.properties` |

| T05  | done   | Rate limit em forgot-password |

| T06  | done   | Headers HTTP (nosniff, DENY, Referrer-Policy, HSTS condicional) |

| T07  | done   | Upload PDF: magic bytes, tamanho máx., sanitize filename |

| T08  | done   | `SecurityFilterChainIntegrationTest` — cenários T1–T7 (MockMvc) |

| T09  | done   | README variáveis de ambiente; progresso atualizado |



**Verificação:** `.\mvnw.cmd test` verde (186 testes). Próximo passo sugerido: `spec-validator` → `reviews/backend-security-hardening-2026-07-30.md`.

---

## usabilidade-pos-revisao — 2026-07-30

| Task | Status | Notas |
|------|--------|-------|
| T01  | done   | jsonb confirmado; testes documentos em LocatarioService/Controller |
| T02  | done   | ContratoRequestDTO + ContratoRequestDTOTest; fiadorId em ContratoServiceTest |
| T03  | done   | erroModal em terrenos, salas, locatários, contratos, pagamentos |
| T04  | done   | errors.ts, /crud removido, filtro salas, dashboard |
| T05  | done   | htmlFor/aria-required; labels opcionais contrato |
| T06  | done   | SortableTh + useEscapeKey em todas páginas |
| T07  | done   | table-scroll, menu mobile, overflow-x |
| T08  | done   | formatAreaInput, favicon |
| T09  | done   | 186 testes verdes; build OK; review compliance |

**Verificação:** `.\mvnw.cmd test` + `npm run build` verdes. Review: `reviews/usabilidade-pos-revisao-2026-07-30.md`.

