package com.felicioecavalaro.gestao_aluguel.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.dto.ForgotPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginResponse;
import com.felicioecavalaro.gestao_aluguel.dto.RegisterRequest;
import com.felicioecavalaro.gestao_aluguel.dto.ResetPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.service.AuthenticationService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthController authController;

    @Test
    void loginReturnsLoginResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha("password");

        LoginResponse mockResponse = LoginResponse.builder()
                .token("test-token")
                .usuarioId(1L)
                .nomeCompleto("Test User")
                .email("test@test.com")
                .build();

        when(authenticationService.login(request)).thenReturn(mockResponse);

        LoginResponse response = authController.login(request);

        assertNotNull(response);
        assertEquals("test-token", response.getToken());
        assertEquals(1L, response.getUsuarioId());
        verify(authenticationService).login(request);
    }

    @Test
    void registerReturnsLoginResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.com");
        request.setNomeCompleto("New User");
        request.setSenha("StrongPassword123!");

        LoginResponse mockResponse = LoginResponse.builder()
                .token("new-token")
                .usuarioId(2L)
                .nomeCompleto("New User")
                .email("newuser@test.com")
                .build();

        when(authenticationService.register(request)).thenReturn(mockResponse);

        LoginResponse response = authController.register(request);

        assertNotNull(response);
        assertEquals("new-token", response.getToken());
        assertEquals(2L, response.getUsuarioId());
        verify(authenticationService).register(request);
    }

    @Test
    void forgotPasswordCallsAuthService() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("forgot@test.com");

        doNothing().when(authenticationService).requestPasswordReset(request);

        authController.forgotPassword(request);

        verify(authenticationService).requestPasswordReset(request);
    }

    @Test
    void resetPasswordCallsAuthService() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNovaSenha("NewPassword123!");

        doNothing().when(authenticationService).resetPassword(request);

        authController.resetPassword(request);

        verify(authenticationService).resetPassword(request);
    }
}
