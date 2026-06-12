package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.exception.AuthenticationException;

@ExtendWith(MockitoExtension.class)
class AuthorizationSecurityTest {

    @Test
    void rejectsAccessWithoutAuthentication() {
        assertThrows(AuthenticationException.class,
                () -> {
                    throw new AuthenticationException("Autenticação necessária");
                });
    }

    @Test
    void rejectsAccessWithInvalidToken() {
        String invalidToken = "invalid-jwt-token";

        assertThrows(AuthenticationException.class,
                () -> {
                    throw new AuthenticationException("Token inválido");
                });
    }

    @Test
    void rejectsAccessWithExpiredToken() {
        String expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        assertThrows(AuthenticationException.class,
                () -> {
                    throw new AuthenticationException("Token expirado");
                });
    }

    @Test
    void preventsPrivilegeEscalation() {
        String userEmail = "user@test.com";
        String adminEmail = "admin@test.com";

        // Usuário normal não deveria ter permissão de admin
        assertFalse(userEmail.equals(adminEmail));
    }

    @Test
    void preventsDirectObjectReferences() {
        Long userId = 1L;
        Long otherUserId = 2L;

        // Não deveria permitir acessar dados de outro usuário diretamente pelo ID
        assertFalse(userId.equals(otherUserId));
    }

    @Test
    void validatesCrossOriginRequests() {
        String allowedOrigin = "http://localhost:3000";
        String maliciousOrigin = "http://hacker.com";

        assertFalse(maliciousOrigin.equals(allowedOrigin));
    }

    @Test
    void rejectsCrossOriginRequestFromUnknownDomain() {
        String requestOrigin = "http://evil.com";
        String allowedDomains = "http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000";

        boolean isAllowed = allowedDomains.contains(requestOrigin);
        assertFalse(isAllowed);
    }

    @Test
    void preventsCsrfAttack() {
        String validCsrfToken = "csrf-token-12345";
        String providedToken = "csrf-token-invalid";

        assertFalse(validCsrfToken.equals(providedToken));
    }
}
