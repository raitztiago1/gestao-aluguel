package com.felicioecavalaro.gestao_aluguel.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PasswordValidator {

    @Value("${app.password.min-length:8}")
    private int minLength;

    @Value("${app.password.max-length:255}")
    private int maxLength;

    public boolean isValid(String password) {
        if (password == null) {
            return false;
        }

        int length = password.length();
        if (length < minLength || length > maxLength) {
            return false;
        }

        if (!password.matches(".*[A-Z].*")) {
            return false;
        }

        if (!password.matches(".*[a-z].*")) {
            return false;
        }

        if (!password.matches(".*\\d.*")) {
            return false;
        }

        return true;
    }

    public String getRequirements() {
        return String.format("A senha deve ter entre %d e %d caracteres, incluindo letras maiúsculas, minúsculas e números.",
                minLength, maxLength);
    }
}

