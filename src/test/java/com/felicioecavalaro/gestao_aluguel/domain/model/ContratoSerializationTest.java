package com.felicioecavalaro.gestao_aluguel.domain.model;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class ContratoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void situacaoIsSerializedInJson() throws Exception {
        Contrato contrato = Contrato.builder().id(1L).build();
        contrato.setSituacao("EM_DIA");

        String json = objectMapper.writeValueAsString(contrato);

        assertTrue(json.contains("\"situacao\":\"EM_DIA\""));
    }

    @Test
    void emDiaIsNotSerializedInJson() throws Exception {
        Contrato contrato = Contrato.builder().id(1L).build();
        contrato.setEmDia(true);
        contrato.setSituacao("EM_DIA");

        String json = objectMapper.writeValueAsString(contrato);

        assertFalse(json.contains("emDia"));
    }
}
