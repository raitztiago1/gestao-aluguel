package com.felicioecavalaro.gestao_aluguel.dto;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
import java.math.BigDecimal;

public record TerrenoDTO(Long id, String endereco, BigDecimal area) {
    public static TerrenoDTO from(Terreno t) {
        return new TerrenoDTO(t.getId(), t.getEndereco(), t.getArea());
    }
}
