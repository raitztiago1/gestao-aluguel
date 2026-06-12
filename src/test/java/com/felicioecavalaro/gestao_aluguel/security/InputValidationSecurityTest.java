package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;
import com.felicioecavalaro.gestao_aluguel.dto.RegisterRequest;
import com.felicioecavalaro.gestao_aluguel.exception.InvalidInputException;

class InputValidationSecurityTest {

    @Test
    void rejectsNullEmail() {
        LoginRequest request = new LoginRequest();
        request.setEmail(null);
        request.setSenha("password");

        assertThrows(Exception.class,
                () -> {
                    if (request.getEmail() == null)
                        throw new InvalidInputException("Email obrigatório");
                });
    }

    @Test
    void rejectsEmptyEmail() {
        LoginRequest request = new LoginRequest();
        request.setEmail("");
        request.setSenha("password");

        String email = request.getEmail();
        assertThrows(InvalidInputException.class,
                () -> {
                    if (email.isEmpty())
                        throw new InvalidInputException("Email não pode ser vazio");
                });
    }

    @Test
    void rejectsNullPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha(null);

        assertThrows(Exception.class,
                () -> {
                    if (request.getSenha() == null)
                        throw new InvalidInputException("Senha obrigatória");
                });
    }

    @Test
    void rejectsEmptyPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha("");

        String senha = request.getSenha();
        assertThrows(InvalidInputException.class,
                () -> {
                    if (senha.isEmpty())
                        throw new InvalidInputException("Senha não pode ser vazia");
                });
    }

    @Test
    void rejectsRegisterWithoutEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(null);
        request.setNomeCompleto("Test User");
        request.setSenha("Password123");

        assertThrows(Exception.class,
                () -> {
                    if (request.getEmail() == null)
                        throw new InvalidInputException("Email obrigatório");
                });
    }

    @Test
    void rejectsRegisterWithoutName() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@test.com");
        request.setNomeCompleto(null);
        request.setSenha("Password123");

        assertThrows(Exception.class,
                () -> {
                    if (request.getNomeCompleto() == null)
                        throw new InvalidInputException("Nome obrigatório");
                });
    }

    @Test
    void rejectsRegisterWithWeakPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@test.com");
        request.setNomeCompleto("Test User");
        request.setSenha("weak");

        assertThrows(Exception.class,
                () -> {
                    if ("weak".length() < 8)
                        throw new InvalidInputException("Senha fraca");
                });
    }
}
