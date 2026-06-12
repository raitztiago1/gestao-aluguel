package com.felicioecavalaro.gestao_aluguel.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class InputSanitizerSecurityTest {

    @Autowired
    private InputSanitizer inputSanitizer;

    @Test
    void rejectsSQLInjectionInEmail() {
        String sqlInjection = "test@test.com'; DROP TABLE usuarios; --";

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeEmail(sqlInjection));
    }

    @Test
    void rejectsXSSAttemptInEmail() {
        String xssAttempt = "test<script>alert('xss')</script>@test.com";

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeEmail(xssAttempt));
    }

    @Test
    void rejectsCommandInjectionInEmail() {
        String commandInjection = "test@test.com; rm -rf /";

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeEmail(commandInjection));
    }

    @Test
    void rejectsInvalidEmailFormats() {
        String[] invalidEmails = {
                "notanemail",
                "@example.com",
                "user@",
                "user @example.com"
        };

        for (String email : invalidEmails) {
            assertThrows(IllegalArgumentException.class,
                    () -> inputSanitizer.sanitizeEmail(email),
                    "Should reject: " + email);
        }
    }

    @Test
    void rejectsXSSInName() {
        String xssInName = "John<script>alert('xss')</script>";

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeName(xssInName));
    }

    @Test
    void rejectsSQLInjectionInName() {
        String sqlInjection = "John'; DROP TABLE usuarios; --";

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeName(sqlInjection));
    }

    @Test
    void rejectsSpecialCharactersInName() {
        String[] invalidNames = {
                "John@Doe",
                "Jane#Smith",
                "Bob$Test",
                "Alice%User",
                "Charlie&Dave"
        };

        for (String name : invalidNames) {
            assertThrows(IllegalArgumentException.class,
                    () -> inputSanitizer.sanitizeName(name),
                    "Should reject: " + name);
        }
    }

    @Test
    void rejectsNameTooShort() {
        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeName("J"));
    }

    @Test
    void rejectsNameTooLong() {
        String longName = "a".repeat(256);

        assertThrows(IllegalArgumentException.class,
                () -> inputSanitizer.sanitizeName(longName));
    }

    @Test
    void acceptsValidEmail() {
        String validEmail = inputSanitizer.sanitizeEmail("valid.user@example.com");
        assertEquals("valid.user@example.com", validEmail);
    }

    @Test
    void acceptsValidNameWithSpecialCharacters() {
        String validName = inputSanitizer.sanitizeName("José da Silva");
        assertEquals("José da Silva", validName);
    }
}
