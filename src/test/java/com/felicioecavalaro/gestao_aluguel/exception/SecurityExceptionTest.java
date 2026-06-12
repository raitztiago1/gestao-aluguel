package com.felicioecavalaro.gestao_aluguel.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import jakarta.persistence.EntityNotFoundException;

class SecurityExceptionTest {

    @Test
    void authenticationExceptionCarriesMensagem() {
        String message = "Email ou senha incorretos";

        AuthenticationException exception = assertThrows(
                AuthenticationException.class,
                () -> {
                    throw new AuthenticationException(message);
                });

        assertEquals(message, exception.getMessage());
    }

    @Test
    void unauthorizedAccessThrowsException() {
        assertThrows(AuthenticationException.class,
                () -> {
                    throw new AuthenticationException("Acesso não autorizado");
                });
    }

    @Test
    void invalidInputThrowsException() {
        assertThrows(InvalidInputException.class,
                () -> {
                    throw new InvalidInputException("Entrada inválida");
                });
    }

    @Test
    void duplicateResourceThrowsException() {
        assertThrows(DuplicateResourceException.class,
                () -> {
                    throw new DuplicateResourceException("Email já cadastrado");
                });
    }

    @Test
    void resourceNotFoundThrowsException() {
        Long missingId = 999L;

        assertThrows(EntityNotFoundException.class,
                () -> {
                    throw new EntityNotFoundException("Recurso não encontrado: " + missingId);
                });
    }
}
