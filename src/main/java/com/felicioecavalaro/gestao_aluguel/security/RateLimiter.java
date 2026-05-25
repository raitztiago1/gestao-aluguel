package com.felicioecavalaro.gestao_aluguel.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RateLimiter {

    @Value("${app.rate-limit.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.rate-limit.lock-duration-minutes:15}")
    private int lockDurationMinutes;

    private final Map<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();

    public void recordAttempt(String email) {
        LoginAttempt attempt = loginAttempts.computeIfAbsent(email, k -> new LoginAttempt());
        attempt.recordAttempt();
        if (attempt.isLocked(maxAttempts)) {
            log.warn("Conta bloqueada por tentativas inválidas: {}", email);
        }
    }

    public void recordSuccess(String email) {
        loginAttempts.remove(email);
    }

    public boolean isLocked(String email) {
        LoginAttempt attempt = loginAttempts.get(email);
        if (attempt == null) {
            return false;
        }
        if (attempt.isExpired(lockDurationMinutes)) {
            loginAttempts.remove(email);
            return false;
        }
        return attempt.isLocked(maxAttempts);
    }

    public String getLockTimeRemaining(String email) {
        LoginAttempt attempt = loginAttempts.get(email);
        if (attempt == null) {
            return null;
        }
        if (attempt.isExpired(lockDurationMinutes)) {
            loginAttempts.remove(email);
            return null;
        }
        long minutesRemaining = attempt.getMinutesRemaining(lockDurationMinutes);
        return String.format("Conta temporariamente bloqueada. Tente novamente em %d minuto(s).", minutesRemaining);
    }

    private static class LoginAttempt {
        private int attempts = 0;
        private long firstAttemptTime = System.currentTimeMillis();

        void recordAttempt() {
            attempts++;
        }

        boolean isLocked(int maxAttempts) {
            return attempts >= maxAttempts;
        }

        boolean isExpired(int lockDurationMinutes) {
            long lockDurationMs = (long) lockDurationMinutes * 60 * 1000;
            return System.currentTimeMillis() - firstAttemptTime > lockDurationMs;
        }

        long getMinutesRemaining(int lockDurationMinutes) {
            long lockDurationMs = (long) lockDurationMinutes * 60 * 1000;
            long elapsedMs = System.currentTimeMillis() - firstAttemptTime;
            long remainingMs = lockDurationMs - elapsedMs;
            return Math.max(1, remainingMs / (60 * 1000));
        }
    }
}
