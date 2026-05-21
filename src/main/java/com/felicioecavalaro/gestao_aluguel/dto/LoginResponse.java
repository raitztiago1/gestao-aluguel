package com.felicioecavalaro.gestao_aluguel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private Long usuarioId;
    private String nomeCompleto;
    private String email;
}
