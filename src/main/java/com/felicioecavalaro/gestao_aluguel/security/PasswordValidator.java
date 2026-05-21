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
        
        if (password.length() < minLength || password.length() > maxLength) {
            return false;
        }
        
        // Requer pelo menos uma maiúscula
        if (!password.matches(".*[A-Z].*")) {
            return false;
        }
        
        // Requer pelo menos uma minúscula
        if (!password.matches(".*[a-z].*")) {
            return false;
        }
        
        // Requer pelo menos um número
        if (!password.matches(".*\\d.*")) {
            return false;
        }
        
        // Requer pelo menos um caractere especial (opcional mas recomendado)
        // if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
        //     return false;
        // }
        
        return true;
    }
    
    public String getRequirements() {
        return String.format("Mínimo %d caracteres com maiúscula, minúscula e número", minLength);
    }
}
