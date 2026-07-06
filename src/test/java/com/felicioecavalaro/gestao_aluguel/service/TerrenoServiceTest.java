package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class TerrenoServiceTest {

    @Mock
    private TerrenoRepository repo;

    @InjectMocks
    private TerrenoService service;

    private Terreno sampleCommercialTerreno() {
        return Terreno.builder()
                .id(1L)
                .tipo(TipoTerreno.COMERCIAL)
                .endereco("Rua Comercial, 100")
                .cidade("São Paulo")
                .estado("SP")
                .metragemTotal(BigDecimal.valueOf(300))
                .vagasGaragem(4)
                .quantidadeSalas(3)
                .build();
    }

    private Terreno sampleResidentialTerreno() {
        return Terreno.builder()
                .id(2L)
                .tipo(TipoTerreno.RESIDENCIAL)
                .endereco("Rua Residencial, 50")
                .cidade("Campinas")
                .estado("SP")
                .metragemTotal(BigDecimal.valueOf(200))
                .metragemCasa(BigDecimal.valueOf(120))
                .build();
    }

    @Test
    void findAllReturnsList() {
        Terreno terreno = sampleCommercialTerreno();
        when(repo.findAll()).thenReturn(List.of(terreno));

        List<Terreno> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals(terreno, result.get(0));
        verify(repo).findAll();
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.findById(1L));

        assertEquals("Terreno não encontrado: 1", exception.getMessage());
        verify(repo).findById(1L);
    }

    @Test
    void createSavesValidCommercialTerreno() {
        Terreno terreno = sampleCommercialTerreno();
        when(repo.save(terreno)).thenReturn(terreno);

        Terreno created = service.create(terreno);

        assertEquals(terreno, created);
        verify(repo).save(terreno);
    }

    @Test
    void createClearsCommercialMetragemSalas() {
        Terreno terreno = sampleCommercialTerreno();
        terreno.setMetragemSalas(BigDecimal.valueOf(120));
        when(repo.save(terreno)).thenReturn(terreno);

        Terreno created = service.create(terreno);

        assertNull(created.getMetragemSalas());
        verify(repo).save(terreno);
    }

    @Test
    void createThrowsWhenTipoIsNull() {
        Terreno terreno = sampleCommercialTerreno();
        terreno.setTipo(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.create(terreno));

        assertEquals("Tipo de terreno é obrigatório", exception.getMessage());
    }

    @Test
    void createThrowsWhenCommercialMissingVagasGaragem() {
        Terreno terreno = sampleCommercialTerreno();
        terreno.setVagasGaragem(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.create(terreno));

        assertEquals("Vagas de garagem são obrigatórias para terreno comercial", exception.getMessage());
    }

    @Test
    void createThrowsWhenResidentialHasCommercialFields() {
        Terreno terreno = sampleResidentialTerreno();
        terreno.setVagasGaragem(2);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.create(terreno));

        assertEquals("Campos de comercial não devem ser informados para terreno residencial", exception.getMessage());
    }

    @Test
    void updateThrowsWhenNotFound() {
        Terreno terreno = sampleCommercialTerreno();
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> service.update(1L, terreno));

        assertEquals("Terreno não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void updateSavesExistingTerreno() {
        Terreno terreno = sampleResidentialTerreno();
        when(repo.existsById(2L)).thenReturn(true);
        when(repo.save(terreno)).thenReturn(terreno);

        Terreno updated = service.update(2L, terreno);

        assertEquals(terreno, updated);
        assertEquals(2L, updated.getId());
        verify(repo).existsById(2L);
        verify(repo).save(terreno);
    }

    @Test
    void deleteThrowsWhenNotFound() {
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.delete(1L));

        assertEquals("Terreno não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void deleteRemovesExistingTerreno() {
        when(repo.existsById(1L)).thenReturn(true);
        doNothing().when(repo).deleteById(1L);

        service.delete(1L);

        verify(repo).existsById(1L);
        verify(repo).deleteById(1L);
    }
}
