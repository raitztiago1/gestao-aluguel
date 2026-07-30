package com.felicioecavalaro.gestao_aluguel.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class RegistrationDisabledException extends RuntimeException {
    public RegistrationDisabledException(String message) {
        super(message);
    }
}
