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

    public void recordAttempt(String key) {
        recordAttempt(key, maxAttempts);
    }

    public void recordAttempt(String key, int maxAttemptsLimit) {
        LoginAttempt attempt = loginAttempts.computeIfAbsent(key, k -> new LoginAttempt());
        attempt.recordAttempt();
        if (attempt.isLocked(maxAttemptsLimit)) {
            log.warn("Chave bloqueada por excesso de tentativas: {}", key);
        }
    }

    public void recordSuccess(String key) {
        loginAttempts.remove(key);
    }

    public boolean isLocked(String key) {
        return isLocked(key, maxAttempts, lockDurationMinutes);
    }

    public boolean isLocked(String key, int maxAttemptsLimit, int lockDurationMinutesLimit) {
        LoginAttempt attempt = loginAttempts.get(key);
        if (attempt == null) {
            return false;
        }
        if (attempt.isExpired(lockDurationMinutesLimit)) {
            loginAttempts.remove(key);
            return false;
        }
        return attempt.isLocked(maxAttemptsLimit);
    }

    public String getLockTimeRemaining(String key) {
        return getLockTimeRemaining(key, lockDurationMinutes);
    }

    public String getLockTimeRemaining(String key, int lockDurationMinutesLimit) {
        LoginAttempt attempt = loginAttempts.get(key);
        if (attempt == null) {
            return null;
        }
        if (attempt.isExpired(lockDurationMinutesLimit)) {
            loginAttempts.remove(key);
            return null;
        }
        long minutesRemaining = attempt.getMinutesRemaining(lockDurationMinutesLimit);
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
