package com.felicioecavalaro.gestao_aluguel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;

public record ContratoRequestDTO(
        Long salaId,
        Long locatarioId,
        LocalDate dataInicio,
        LocalDate dataTermino,
        BigDecimal valorAluguel,
        Integer diaVencimento,
        Integer diaVencimentoAgua,
        Integer diaVencimentoLuz,
        Integer diaVencimentoIptu,
        BigDecimal valorOutrasDespesas,
        StatusContrato status,
        String observacoes,
        Long fiadorId,
        Long caucaoId) {

    public Contrato toEntity() {
        Contrato contrato = new Contrato();
        applyTo(contrato);
        return contrato;
    }

    public void applyTo(Contrato contrato) {
        if (salaId != null) {
            Sala sala = new Sala();
            sala.setId(salaId);
            contrato.setSala(sala);
        }
        if (locatarioId != null) {
            Locatario locatario = new Locatario();
            locatario.setId(locatarioId);
            contrato.setLocatario(locatario);
        }
        contrato.setDataInicio(dataInicio);
        contrato.setDataTermino(dataTermino);
        contrato.setValorAluguel(valorAluguel);
        contrato.setDiaVencimento(diaVencimento);
        contrato.setDiaVencimentoAgua(diaVencimentoAgua);
        contrato.setDiaVencimentoLuz(diaVencimentoLuz);
        contrato.setDiaVencimentoIptu(diaVencimentoIptu);
        contrato.setValorOutrasDespesas(valorOutrasDespesas);
        if (status != null) {
            contrato.setStatus(status);
        }
        contrato.setObservacoes(observacoes);
        contrato.setFiadorId(fiadorId);
        contrato.setCaucaoId(caucaoId);
    }

    public static ContratoRequestDTO fromPayload(ContratoPayload payload) {
        Long salaId = payload.sala() != null ? payload.sala().id() : null;
        Long locatarioId = payload.locatario() != null ? payload.locatario().id() : null;
        return new ContratoRequestDTO(
                salaId,
                locatarioId,
                payload.dataInicio(),
                payload.dataTermino(),
                payload.valorAluguel(),
                payload.diaVencimento(),
                payload.diaVencimentoAgua(),
                payload.diaVencimentoLuz(),
                payload.diaVencimentoIptu(),
                payload.valorOutrasDespesas(),
                payload.status(),
                payload.observacoes(),
                payload.fiadorId(),
                payload.caucaoId());
    }

    public record ContratoPayload(
            EntityRef sala,
            EntityRef locatario,
            LocalDate dataInicio,
            LocalDate dataTermino,
            BigDecimal valorAluguel,
            Integer diaVencimento,
            Integer diaVencimentoAgua,
            Integer diaVencimentoLuz,
            Integer diaVencimentoIptu,
            BigDecimal valorOutrasDespesas,
            StatusContrato status,
            String observacoes,
            Long fiadorId,
            Long caucaoId) {
    }

    public record EntityRef(Long id) {
    }
}
