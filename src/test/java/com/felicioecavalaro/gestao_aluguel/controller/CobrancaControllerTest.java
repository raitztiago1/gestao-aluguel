package com.felicioecavalaro.gestao_aluguel.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.service.CobrancaService;

@ExtendWith(MockitoExtension.class)
class CobrancaControllerTest {
    @Mock
    private CobrancaService service;

    @InjectMocks
    private CobrancaController controller;

    private Cobranca sampleCobranca() {
        return Cobranca.builder()
                .id(1L)
                .contrato(Contrato.builder().id(1L).build())
                .ano(2024)
                .mes(6)
                .valor(BigDecimal.valueOf(1500))
                .status(StatusCobranca.PENDENTE)
                .build();
    }

    @Test
    void listReturnsAllCobrancas() {
        Cobranca cobranca = sampleCobranca();
        when(service.findAll()).thenReturn(List.of(cobranca));

        List<Cobranca> result = controller.list();

        assertEquals(1, result.size());
        assertEquals(cobranca, result.get(0));
        verify(service).findAll();
    }

    @Test
    void getReturnsCobranca() {
        Cobranca cobranca = sampleCobranca();
        when(service.findById(1L)).thenReturn(cobranca);

        Cobranca result = controller.get(1L);

        assertEquals(cobranca, result);
        verify(service).findById(1L);
    }

    @Test
    void listByContratoReturnsCobrancasForContrato() {
        Cobranca cobranca = sampleCobranca();
        when(service.findByContratoId(1L)).thenReturn(List.of(cobranca));

        List<Cobranca> result = controller.listByContrato(1L);

        assertEquals(1, result.size());
        assertEquals(cobranca, result.get(0));
        verify(service).findByContratoId(1L);
    }

    @Test
    void createReturnsSavedCobranca() {
        Cobranca cobranca = sampleCobranca();
        when(service.create(any(Cobranca.class))).thenReturn(cobranca);

        Cobranca result = controller.create(cobranca);

        assertEquals(cobranca, result);
        verify(service).create(cobranca);
    }

    @Test
    void registerMonthlyStatusReturnsCobranca() {
        Cobranca cobranca = sampleCobranca();
        Cobranca payload = Cobranca.builder().status(StatusCobranca.PAGO).build();

        when(service.registerMonthlyStatus(1L, 2024, 6, payload)).thenReturn(cobranca);

        Cobranca result = controller.registerMonthlyStatus(1L, 2024, 6, payload);

        assertEquals(cobranca, result);
        verify(service).registerMonthlyStatus(1L, 2024, 6, payload);
    }

    @Test
    void updateReturnsSavedCobranca() {
        Cobranca cobranca = sampleCobranca();
        when(service.update(1L, cobranca)).thenReturn(cobranca);

        Cobranca result = controller.update(1L, cobranca);

        assertEquals(cobranca, result);
        verify(service).update(1L, cobranca);
    }
}
