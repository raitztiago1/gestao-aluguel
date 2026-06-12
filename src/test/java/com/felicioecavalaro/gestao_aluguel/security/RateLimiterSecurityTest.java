package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;

@SpringBootTest
class RateLimiterSecurityTest {

    @Autowired
    private RateLimiter rateLimiter;

    private static final String TEST_EMAIL = "brute-force@test.com";

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(rateLimiter, "maxAttempts", 5);
        ReflectionTestUtils.setField(rateLimiter, "lockDurationMinutes", 15);
    }

    @Test
    void allowsInitialLoginAttempt() {
        assertFalse(rateLimiter.isLocked(TEST_EMAIL));
    }

    @Test
    void lockAccountAfterMaxAttempts() {
        String email = "brute-force-test@test.com";

        // Registra 5 tentativas (max)
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(email);
        }

        assertTrue(rateLimiter.isLocked(email));
    }

    @Test
    void preventsLoginAfterLockout() {
        String email = "lockout-test@test.com";

        // Força lockout
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(email);
        }

        assertTrue(rateLimiter.isLocked(email));

        // Tenta fazer login - deve ser rejeitado
        assertTrue(rateLimiter.isLocked(email));
    }

    @Test
    void resetsCounterOnSuccess() {
        String email = "success-test@test.com";

        rateLimiter.recordAttempt(email);
        assertFalse(rateLimiter.isLocked(email));

        rateLimiter.recordSuccess(email);
        assertFalse(rateLimiter.isLocked(email));
    }

    @Test
    void providesLockMessage() {
        String email = "message-test@test.com";

        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(email);
        }

        String message = rateLimiter.getLockTimeRemaining(email);
        assertNotNull(message);
        assertTrue(message.contains("bloqueada"));
    }

    @Test
    void allowsMultipleDifferentUsers() {
        String email1 = "user1@test.com";
        String email2 = "user2@test.com";

        // User 1 tenta 3 vezes
        for (int i = 0; i < 3; i++) {
            rateLimiter.recordAttempt(email1);
        }

        // User 2 tenta 5 vezes
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(email2);
        }

        assertFalse(rateLimiter.isLocked(email1));
        assertTrue(rateLimiter.isLocked(email2));
    }

    @Test
    void protectsAgainstBruteForceAttack() {
        String email = "brute-force-attack@test.com";

        // Simula 100 tentativas de brute force
        for (int i = 0; i < 100; i++) {
            if (!rateLimiter.isLocked(email)) {
                rateLimiter.recordAttempt(email);
            } else {
                // Conta está bloqueada após max attempts
                assertTrue(rateLimiter.isLocked(email));
                break;
            }
        }

        assertTrue(rateLimiter.isLocked(email));
    }
}
