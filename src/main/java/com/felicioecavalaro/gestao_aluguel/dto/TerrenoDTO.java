package com.felicioecavalaro.gestao_aluguel.dto;

import java.math.BigDecimal;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
import com.felicioecavalaro.gestao_aluguel.domain.TipoTerreno;

public record TerrenoDTO(Long id, TipoTerreno tipo, String endereco, BigDecimal metragemTotal) {
    public static TerrenoDTO from(Terreno t) {
        return new TerrenoDTO(t.getId(), t.getTipo(), t.getEndereco(), t.getMetragemTotal());
    }
}
