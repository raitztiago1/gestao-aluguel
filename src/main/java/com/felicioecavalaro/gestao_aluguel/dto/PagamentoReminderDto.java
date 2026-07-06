package com.felicioecavalaro.gestao_aluguel.dto;

import java.math.BigDecimal;
import java.util.List;

public record PagamentoReminderDto(
        String locatarioNome,
        String locatarioEmail,
        String mesReferencia,
        List<ContratoReminderDto> contratos) {

    public record ContratoReminderDto(
            String salaIdentificacao,
            int diaVencimentoAluguel,
            Integer diaVencimentoAgua,
            Integer diaVencimentoLuz,
            Integer diaVencimentoIptu,
            BigDecimal valorAluguel,
            BigDecimal valorCondominio,
            BigDecimal valorIptu,
            BigDecimal valorOutrasDespesas,
            List<PendenciaDto> pendencias) {
    }

    public record PendenciaDto(
            String referencia,
            BigDecimal valor,
            String descricao) {
    }
}
