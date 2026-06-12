package com.felicioecavalaro.gestao_aluguel.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.service.SalaService;

@ExtendWith(MockitoExtension.class)
class SalaControllerTest {

    @Mock
    private SalaService service;

    @InjectMocks
    private SalaController controller;

    private Sala sampleSala() {
        return Sala.builder()
                .id(1L)
                .identificacao("Sala Teste")
                .build();
    }

    @Test
    void listReturnsAllSalas() {
        Sala sala = sampleSala();
        when(service.findAll()).thenReturn(List.of(sala));

        List<Sala> result = controller.list();

        assertEquals(1, result.size());
        assertEquals(sala, result.get(0));
        verify(service).findAll();
    }

    @Test
    void getReturnsSala() {
        Sala sala = sampleSala();
        when(service.findById(1L)).thenReturn(sala);

        Sala result = controller.get(1L);

        assertEquals(sala, result);
        verify(service).findById(1L);
    }

    @Test
    void createReturnsCreatedSala() {
        Sala sala = sampleSala();
        when(service.create(sala)).thenReturn(sala);

        Sala result = controller.create(sala);

        assertEquals(sala, result);
        verify(service).create(sala);
    }
}
