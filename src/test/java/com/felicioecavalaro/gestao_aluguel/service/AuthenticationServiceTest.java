package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginResponse;
import com.felicioecavalaro.gestao_aluguel.dto.RegisterRequest;
import com.felicioecavalaro.gestao_aluguel.exception.AuthenticationException;
import com.felicioecavalaro.gestao_aluguel.exception.DuplicateResourceException;
import com.felicioecavalaro.gestao_aluguel.exception.InvalidInputException;
import com.felicioecavalaro.gestao_aluguel.repository.UsuarioRepository;
import com.felicioecavalaro.gestao_aluguel.security.InputSanitizer;
import com.felicioecavalaro.gestao_aluguel.security.PasswordValidator;
import com.felicioecavalaro.gestao_aluguel.security.RateLimiter;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private PasswordValidator passwordValidator;

    @Mock
    private InputSanitizer inputSanitizer;

    @Mock
    private RateLimiter rateLimiter;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthenticationService authenticationService;

    private Usuario sampleUsuario() {
        return Usuario.builder()
                .id(1L)
                .email("test@test.com")
                .nomeCompleto("Test User")
                .senha("$2a$10$encryptedpassword")
                .ativo(true)
                .build();
    }

    @Test
    void loginThrowsWhenNullRequest() {
        assertThrows(InvalidInputException.class, () -> authenticationService.login(null));
    }

    @Test
    void loginThrowsWhenSenhaIsNull() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha(null);

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("test@test.com");

        assertThrows(InvalidInputException.class, () -> authenticationService.login(request));
    }

    @Test
    void loginThrowsWhenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("invalid@test.com");
        request.setSenha("password123");

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("invalid@test.com");
        when(rateLimiter.isLocked(anyString())).thenReturn(false);
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(AuthenticationException.class, () -> authenticationService.login(request));
    }

    @Test
    void loginSuccessful() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha("correctPassword");

        Usuario usuario = sampleUsuario();
        String token = "valid-jwt-token";

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("test@test.com");
        when(rateLimiter.isLocked(anyString())).thenReturn(false);
        when(usuarioRepository.findByEmail("test@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("correctPassword", usuario.getSenha())).thenReturn(true);
        when(jwtService.generateToken(usuario)).thenReturn(token);

        LoginResponse response = authenticationService.login(request);

        assertNotNull(response);
        assertEquals(token, response.getToken());
        assertEquals(usuario.getId(), response.getUsuarioId());
        verify(rateLimiter).recordSuccess("test@test.com");
    }

    @Test
    void registerThrowsWhenNullRequest() {
        assertThrows(InvalidInputException.class, () -> authenticationService.register(null));
    }

    @Test
    void registerThrowsWhenInvalidPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.com");
        request.setNomeCompleto("New User");
        request.setSenha("weak");

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("newuser@test.com");
        when(inputSanitizer.sanitizeName(anyString())).thenReturn("New User");
        when(passwordValidator.isValid("weak")).thenReturn(false);
        when(passwordValidator.getRequirements()).thenReturn("Password requirements");

        assertThrows(InvalidInputException.class, () -> authenticationService.register(request));
    }

    @Test
    void registerThrowsWhenEmailDuplicate() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("duplicate@test.com");
        request.setNomeCompleto("Duplicate User");
        request.setSenha("StrongPassword123!");

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("duplicate@test.com");
        when(inputSanitizer.sanitizeName(anyString())).thenReturn("Duplicate User");
        when(passwordValidator.isValid("StrongPassword123!")).thenReturn(true);
        when(usuarioRepository.existsByEmail("duplicate@test.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authenticationService.register(request));
    }

    @Test
    void registerSuccessful() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.com");
        request.setNomeCompleto("New User");
        request.setSenha("StrongPassword123!");

        Usuario newUsuario = Usuario.builder()
                .id(2L)
                .email("newuser@test.com")
                .nomeCompleto("New User")
                .ativo(true)
                .build();

        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("newuser@test.com");
        when(inputSanitizer.sanitizeName(anyString())).thenReturn("New User");
        when(passwordValidator.isValid("StrongPassword123!")).thenReturn(true);
        when(usuarioRepository.existsByEmail("newuser@test.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPassword123!")).thenReturn("$2a$10$hashed");
        when(usuarioRepository.save(org.mockito.ArgumentMatchers.any())).thenReturn(newUsuario);
        when(jwtService.generateToken(newUsuario)).thenReturn("new-token");

        LoginResponse response = authenticationService.register(request);

        assertNotNull(response);
        assertEquals("new-token", response.getToken());
        assertEquals(2L, response.getUsuarioId());
    }

    @Test
    void findByEmailThrowsWhenNotFound() {
        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("nonexistent@test.com");
        when(usuarioRepository.findByEmail("nonexistent@test.com")).thenReturn(Optional.empty());

        assertThrows(AuthenticationException.class, () -> authenticationService.findByEmail("nonexistent@test.com"));
    }

    @Test
    void findByEmailReturnsUsuario() {
        Usuario usuario = sampleUsuario();
        when(inputSanitizer.sanitizeEmail(anyString())).thenReturn("test@test.com");
        when(usuarioRepository.findByEmail("test@test.com")).thenReturn(Optional.of(usuario));

        Usuario result = authenticationService.findByEmail("test@test.com");

        assertEquals(usuario, result);
    }
}
