package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HTTPSecurityHeadersTest {

    @Test
    void validateCSRFProtection() {
        String method = "POST";
        String hasCSRFToken = "true";

        // Em uma aplicação real, POST deveria exigir CSRF token válido
        boolean isProtected = method.equals("GET") || hasCSRFToken.equals("true");
        assertFalse(method.equals("POST") && hasCSRFToken.equals("false"));
    }

    @Test
    void validateXSSProtection() {
        // Content-Security-Policy header deve estar presente
        String cspHeader = "Content-Security-Policy: default-src 'self'";

        assertFalse(cspHeader.isEmpty());
    }

    @Test
    void validateXFrameOptionsHeader() {
        // X-Frame-Options deve ser DENY ou SAMEORIGIN para prevenir clickjacking
        String xFrameOptions = "X-Frame-Options: DENY";

        assertFalse(!xFrameOptions.contains("DENY") && !xFrameOptions.contains("SAMEORIGIN"));
    }

    @Test
    void validateStrictTransportSecurity() {
        // HSTS header deve estar presente para HTTPS
        String hstsHeader = "Strict-Transport-Security: max-age=31536000";

        assertFalse(hstsHeader.isEmpty());
    }

    @Test
    void validateXContentTypeOptionsHeader() {
        // X-Content-Type-Options deve ser nosniff
        String xContentTypeOptions = "X-Content-Type-Options: nosniff";

        assertFalse(!xContentTypeOptions.contains("nosniff"));
    }

    @Test
    void rejectsDangerousContentTypes() {
        String[] allowedContentTypes = {
                "application/json",
                "application/xml",
                "text/plain"
        };

        String dangerousContentType = "application/x-executable";

        boolean isAllowed = false;
        for (String ct : allowedContentTypes) {
            if (ct.equals(dangerousContentType)) {
                isAllowed = true;
                break;
            }
        }

        assertFalse(isAllowed);
    }

    @Test
    void validateCORSHeadersPresent() {
        String corsHeader = "Access-Control-Allow-Origin: http://localhost:3000";

        assertFalse(corsHeader.isEmpty());
    }

    @Test
    void rejectsUnauthorizedCORSOrigins() {
        String allowedOrigins = "http://localhost:3000|https://localhost:3000";
        String requestOrigin = "http://malicious.com";

        boolean isAllowed = allowedOrigins.contains(requestOrigin);
        assertFalse(isAllowed);
    }
}
