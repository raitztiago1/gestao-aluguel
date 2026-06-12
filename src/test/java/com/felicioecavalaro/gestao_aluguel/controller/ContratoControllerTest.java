package com.felicioecavalaro.gestao_aluguel.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.service.ContratoService;

@ExtendWith(MockitoExtension.class)
class ContratoControllerTest {

    @Mock
    private ContratoService service;

    @InjectMocks
    private ContratoController controller;

    private Contrato sampleContrato() {
        return Contrato.builder()
                .id(1L)
                .sala(new Sala())
                .locatario(new Locatario())
                .dataInicio(LocalDate.now())
                .dataTermino(LocalDate.now().plusMonths(12))
                .valorAluguel(BigDecimal.valueOf(1500))
                .diaVencimento(5)
                .build();
    }

    @Test
    void listReturnsAllContratos() {
        Contrato contrato = sampleContrato();
        when(service.findAll()).thenReturn(List.of(contrato));

        List<Contrato> result = controller.list();

        assertEquals(1, result.size());
        assertEquals(contrato, result.get(0));
        verify(service).findAll();
    }

    @Test
    void getReturnsContrato() {
        Contrato contrato = sampleContrato();
        when(service.findById(1L)).thenReturn(contrato);

        Contrato result = controller.get(1L);

        assertEquals(contrato, result);
        verify(service).findById(1L);
    }

    @Test
    void createReturnsSavedContrato() {
        Contrato contrato = sampleContrato();
        when(service.create(any(Contrato.class))).thenReturn(contrato);

        Contrato result = controller.create(contrato);

        assertEquals(contrato, result);
        verify(service).create(contrato);
    }
}
