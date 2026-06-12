package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PasswordValidatorSecurityTest {

    @Autowired
    private PasswordValidator passwordValidator;

    @Test
    void rejectsPasswordTooShort() {
        assertFalse(passwordValidator.isValid("Short1"));
    }

    @Test
    void rejectsPasswordWithoutUppercase() {
        assertFalse(passwordValidator.isValid("lowercase123"));
    }

    @Test
    void rejectsPasswordWithoutLowercase() {
        assertFalse(passwordValidator.isValid("UPPERCASE123"));
    }

    @Test
    void rejectsPasswordWithoutNumbers() {
        assertFalse(passwordValidator.isValid("NoNumbers!"));
    }

    @Test
    void acceptsValidPasswordWithRequirements() {
        // Senha com maiúscula, minúscula e número é aceita
        assertTrue(passwordValidator.isValid("Password1"));
        assertTrue(passwordValidator.isValid("Qwerty123"));
        assertTrue(passwordValidator.isValid("Admin123"));
    }

    @Test
    void acceptsStrongPassword() {
        assertTrue(passwordValidator.isValid("StrongP@ssw0rd123!"));
    }

    @Test
    void acceptsValidPassword() {
        assertTrue(passwordValidator.isValid("ValidPass123"));
    }

    @Test
    void rejectsNull() {
        assertFalse(passwordValidator.isValid(null));
    }

    @Test
    void rejectsEmpty() {
        assertFalse(passwordValidator.isValid(""));
    }

    @Test
    void acceptsManyVariations() {
        // O validador apenas verifica se tem maiúscula, minúscula e número
        assertTrue(passwordValidator.isValid("AnyPass123"));
        assertTrue(passwordValidator.isValid("Test12345"));
    }
}
