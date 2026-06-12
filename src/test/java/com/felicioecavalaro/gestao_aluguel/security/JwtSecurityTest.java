package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.service.JwtService;

@SpringBootTest
class JwtSecurityTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void generatesValidToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .build();

        String token = jwtService.generateToken(usuario);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void tokenContainsThreeParts() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .build();

        String token = jwtService.generateToken(usuario);

        // JWT deve ter 3 partes separadas por pontos: header.payload.signature
        String[] parts = token.split("\\.");
        assertTrue(parts.length == 3, "JWT deve ter 3 partes");
    }

    @Test
    void rejectsInvalidToken() {
        String invalidToken = "invalid.token.here";

        boolean isValid = jwtService.isTokenValid(invalidToken);
        assertFalse(isValid);
    }

    @Test
    void rejectsModifiedToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .build();

        String token = jwtService.generateToken(usuario);
        // Modifica o token alterando um caractere
        String modifiedToken = token.substring(0, token.length() - 1) + "x";

        boolean isValid = jwtService.isTokenValid(modifiedToken);
        assertFalse(isValid);
    }

    @Test
    void acceptsValidToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .build();

        String token = jwtService.generateToken(usuario);

        boolean isValid = jwtService.isTokenValid(token);
        assertTrue(isValid);
    }

    @Test
    void extractsUserInfoFromToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .build();

        String token = jwtService.generateToken(usuario);

        // Se token é válido, deve-se conseguir extrair informações
        assertTrue(jwtService.isTokenValid(token));
        assertNotNull(jwtService.extractEmail(token));
    }

    @Test
    void tokenSignatureIsSecure() {
        Usuario usuario1 = Usuario.builder()
                .id(1L)
                .email("user1@test.com")
                .nomeCompleto("User One")
                .build();

        Usuario usuario2 = Usuario.builder()
                .id(2L)
                .email("user2@test.com")
                .nomeCompleto("User Two")
                .build();

        String token1 = jwtService.generateToken(usuario1);
        String token2 = jwtService.generateToken(usuario2);

        // Tokens de usuários diferentes devem ser diferentes
        assertFalse(token1.equals(token2));
    }
}
