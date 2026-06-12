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

import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.service.LocatarioService;

@ExtendWith(MockitoExtension.class)
class LocatarioControllerTest {

    @Mock
    private LocatarioService service;

    @InjectMocks
    private LocatarioController controller;

    private Locatario sampleLocatario() {
        return Locatario.builder()
                .id(1L)
                .nome("Teste Locatario")
                .build();
    }

    @Test
    void listReturnsAllLocatarios() {
        Locatario locatario = sampleLocatario();
        when(service.findAll()).thenReturn(List.of(locatario));

        List<Locatario> result = controller.list();

        assertEquals(1, result.size());
        assertEquals(locatario, result.get(0));
        verify(service).findAll();
    }

    @Test
    void getReturnsLocatario() {
        Locatario locatario = sampleLocatario();
        when(service.findById(1L)).thenReturn(locatario);

        Locatario result = controller.get(1L);

        assertEquals(locatario, result);
        verify(service).findById(1L);
    }

    @Test
    void createReturnsCreatedLocatario() {
        Locatario locatario = sampleLocatario();
        when(service.create(locatario)).thenReturn(locatario);

        Locatario result = controller.create(locatario);

        assertEquals(locatario, result);
        verify(service).create(locatario);
    }
}
