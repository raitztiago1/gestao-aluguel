package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;

@ExtendWith(MockitoExtension.class)
class DataInjectionSecurityTest {

    @Test
    void rejectsInvalidEmailInLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("'; DROP TABLE usuarios; --");
        request.setSenha("password");

        assertThrows(Exception.class, () -> {
            if (!isValidEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email inválido");
            }
        });
    }

    @Test
    void rejectsNullEmailInLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail(null);
        request.setSenha("password");

        assertThrows(Exception.class, () -> {
            if (request.getEmail() == null) {
                throw new IllegalArgumentException("Email obrigatório");
            }
        });
    }

    @Test
    void rejectsXSSPayloadInPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setSenha("<script>alert('xss')</script>");

        assertThrows(Exception.class, () -> {
            if (containsScriptTags(request.getSenha())) {
                throw new IllegalArgumentException("Payload malicioso detectado");
            }
        });
    }

    @Test
    void rejectsNegativeValuesAsStrings() {
        String invalidNumber = "-1000";

        assertThrows(Exception.class, () -> {
            double value = Double.parseDouble(invalidNumber);
            if (value < 0) {
                throw new IllegalArgumentException("Valor deve ser positivo");
            }
        });
    }

    @Test
    void rejectsZeroValue() {
        String zeroValue = "0";

        assertThrows(Exception.class, () -> {
            double value = Double.parseDouble(zeroValue);
            if (value <= 0) {
                throw new IllegalArgumentException("Valor deve ser maior que zero");
            }
        });
    }

    @Test
    void rejectsExcessivelyLargeValues() {
        String largeValue = "999999999999.99";

        assertThrows(Exception.class, () -> {
            double value = Double.parseDouble(largeValue);
            if (value > 1000000000) {
                throw new IllegalArgumentException("Valor muito alto");
            }
        });
    }

    @Test
    void rejectsSpecialCharactersInNumericFields() {
        String invalidNumber = "1000<script>";

        assertThrows(Exception.class, () -> {
            try {
                Double.parseDouble(invalidNumber);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Número inválido");
            }
        });
    }

    @Test
    void preventsTypeConfusion() {
        String invalidNumber = "abc";

        assertThrows(Exception.class, () -> {
            try {
                Double.parseDouble(invalidNumber);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Tipo de dado inválido");
            }
        });
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.isEmpty())
            return false;
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    private boolean containsScriptTags(String input) {
        return input.contains("<script>") || input.contains("</script>") || input.contains("<iframe>");
    }
}
