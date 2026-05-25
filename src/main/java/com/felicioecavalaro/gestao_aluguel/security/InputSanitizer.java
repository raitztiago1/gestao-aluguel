package com.felicioecavalaro.gestao_aluguel.security;

import org.springframework.stereotype.Component;

@Component
public class InputSanitizer {

    private static final int MAX_EMAIL_LENGTH = 255;
    private static final int MAX_NAME_LENGTH = 255;
    private static final int MIN_NAME_LENGTH = 2;

    public String sanitizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Email inválido");
        }

        String trimmed = email.trim().toLowerCase();
        if (trimmed.isEmpty() || trimmed.length() > MAX_EMAIL_LENGTH) {
            throw new IllegalArgumentException("Email inválido");
        }

        if (!isValidEmail(trimmed)) {
            throw new IllegalArgumentException("Formato de email inválido");
        }

        return trimmed;
    }

    public String sanitizeName(String name) {
        if (name == null) {
            throw new IllegalArgumentException("Nome inválido");
        }

        String trimmed = name.trim();
        if (trimmed.length() < MIN_NAME_LENGTH || trimmed.length() > MAX_NAME_LENGTH) {
            throw new IllegalArgumentException("Nome deve ter entre " + MIN_NAME_LENGTH + " e " + MAX_NAME_LENGTH + " caracteres");
        }

        if (!trimmed.matches("[\\p{L}\\p{N}\\s'\\-]+")) {
            throw new IllegalArgumentException("Nome contém caracteres inválidos");
        }

        return trimmed;
    }

    private boolean isValidEmail(String email) {
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }
}

