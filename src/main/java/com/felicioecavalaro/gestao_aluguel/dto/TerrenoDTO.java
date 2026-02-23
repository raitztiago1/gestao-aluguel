package com.felicioecavalaro.gestao_aluguel.dto;

import java.math.BigDecimal;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;

public record TerrenoDTO(Long id, String endereco, BigDecimal area) {
    public static TerrenoDTO from(Terreno t) {
        return new TerrenoDTO(t.getId(), t.getEndereco(), t.getArea());
    }
}
