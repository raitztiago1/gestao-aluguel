package com.felicioecavalaro.gestao_aluguel.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.service.TerrenoService;

@ExtendWith(MockitoExtension.class)
class TerrenoControllerTest {

    @Mock
    private TerrenoService service;

    @InjectMocks
    private TerrenoController controller;

    private Terreno sampleTerreno() {
        return Terreno.builder()
                .id(1L)
                .tipo(TipoTerreno.COMERCIAL)
                .endereco("Rua Teste, 123")
                .cidade("São Paulo")
                .estado("SP")
                .metragemTotal(BigDecimal.valueOf(250))
                .vagasGaragem(2)
                .quantidadeSalas(2)
                .metragemSalas(BigDecimal.valueOf(80))
                .build();
    }

    @Test
    void listReturnsAllTerrenos() {
        Terreno terreno = sampleTerreno();
        when(service.findAll()).thenReturn(List.of(terreno));

        List<Terreno> result = controller.list();

        assertEquals(1, result.size());
        assertEquals(terreno, result.get(0));
        verify(service).findAll();
    }

    @Test
    void getReturnsTerreno() {
        Terreno terreno = sampleTerreno();
        when(service.findById(1L)).thenReturn(terreno);

        Terreno result = controller.get(1L);

        assertEquals(terreno, result);
        verify(service).findById(1L);
    }

    @Test
    void createReturnsCreatedTerreno() {
        Terreno terreno = sampleTerreno();
        when(service.create(terreno)).thenReturn(terreno);

        Terreno result = controller.create(terreno);

        assertEquals(terreno, result);
        verify(service).create(terreno);
    }

    @Test
    void updateReturnsUpdatedTerreno() {
        Terreno terreno = sampleTerreno();
        when(service.update(1L, terreno)).thenReturn(terreno);

        Terreno result = controller.update(1L, terreno);

        assertEquals(terreno, result);
        verify(service).update(1L, terreno);
    }

    @Test
    void deleteCallsServiceDelete() {
        controller.delete(1L);

        verify(service).delete(1L);
    }
}
