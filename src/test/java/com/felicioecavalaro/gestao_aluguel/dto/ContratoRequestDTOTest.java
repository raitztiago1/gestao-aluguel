package com.felicioecavalaro.gestao_aluguel.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;

class ContratoRequestDTOTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void deserializesPayloadWithoutEmDiaField() throws Exception {
        String json = """
                {
                  "sala": { "id": 1 },
                  "locatario": { "id": 2 },
                  "dataInicio": "2026-01-01",
                  "dataTermino": "2027-01-01",
                  "valorAluguel": 2500.00,
                  "diaVencimento": 10,
                  "caucaoId": 5
                }
                """;

        ContratoRequestDTO.ContratoPayload payload = objectMapper.readValue(json, ContratoRequestDTO.ContratoPayload.class);
        ContratoRequestDTO dto = ContratoRequestDTO.fromPayload(payload);

        assertEquals(1L, dto.salaId());
        assertEquals(2L, dto.locatarioId());
        assertEquals(LocalDate.of(2026, 1, 1), dto.dataInicio());
        assertEquals(LocalDate.of(2027, 1, 1), dto.dataTermino());
        assertEquals(new BigDecimal("2500.00"), dto.valorAluguel());
        assertEquals(10, dto.diaVencimento());
        assertEquals(5L, dto.caucaoId());
        assertNull(dto.fiadorId());
    }

    @Test
    void deserializesPayloadWithFiadorId() throws Exception {
        String json = """
                {
                  "sala": { "id": 3 },
                  "locatario": { "id": 4 },
                  "dataInicio": "2026-02-01",
                  "dataTermino": "2027-02-01",
                  "valorAluguel": 1800.00,
                  "diaVencimento": 5,
                  "fiadorId": 9
                }
                """;

        ContratoRequestDTO.ContratoPayload payload = objectMapper.readValue(json, ContratoRequestDTO.ContratoPayload.class);
        ContratoRequestDTO dto = ContratoRequestDTO.fromPayload(payload);

        assertEquals(9L, dto.fiadorId());
        assertNull(dto.caucaoId());
    }
}
