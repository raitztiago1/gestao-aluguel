# Referência — Backend Security Hardening

## Arquivos-chave

```text
src/main/java/.../security/SecurityConfig.java
src/main/java/.../security/JwtFilter.java
src/main/java/.../security/RateLimiter.java
src/main/java/.../controller/TestController.java          (@Profile dev)
src/main/java/.../service/AuthenticationService.java
src/main/java/.../service/ContratoDocumentoService.java
src/main/java/.../exception/RegistrationDisabledException.java
src/main/resources/application.properties
src/main/resources/application-prod.properties
src/test/resources/application-test.properties
src/test/.../security/SecurityFilterChainIntegrationTest.java
```

## Variáveis de ambiente (produção)

```powershell
$env:SPRING_PROFILES_ACTIVE = "prod"
$env:APP_JWT_SECRET = "<64+ caracteres aleatórios>"
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://host:5432/gestao_aluguel"
$env:SPRING_DATASOURCE_USERNAME = "..."
$env:SPRING_DATASOURCE_PASSWORD = "..."
```

## Propriedades relevantes

```properties
# Dev (application.properties)
spring.profiles.active=dev
app.auth.registration-enabled=true
app.rate-limit.max-attempts=5
app.rate-limit.forgot-password.max-attempts=5
app.upload.max-file-size=10485760
spring.servlet.multipart.max-file-size=10MB

# Prod (application-prod.properties)
app.auth.registration-enabled=false
app.jwt.secret=${APP_JWT_SECRET}
```

## Evidência de testes (baseline 2026-07-30)

- Suite completa: **181 testes**, BUILD SUCCESS
- `SecurityFilterChainIntegrationTest`: 7 cenários
- `AuthenticationServiceTest`: 14 (incl. register disabled, forgot rate limit)
- `ContratoDocumentoServiceTest`: 4 (PDF válido, fake, oversized, sanitize)

## Extensões futuras (requer spec nova)

- RBAC (`ROLE_ADMIN`, `ROLE_USER`)
- Refresh token + blacklist
- Rate limit distribuído (Redis)
- CSP no Next.js
- CORS restrito por domínio de produção
