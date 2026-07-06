package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class SalaServiceTest {

    @Mock
    private SalaRepository repo;

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private TerrenoRepository terrenoRepository;

    @InjectMocks
    private SalaService service;

    private Sala sampleSala() {
        return Sala.builder()
                .id(1L)
                .identificacao("Sala Teste")
                .build();
    }

    @Test
    void findAllReturnsList() {
        Sala sala = sampleSala();
        when(repo.findAll()).thenReturn(List.of(sala));

        List<Sala> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals(sala, result.get(0));
        verify(repo).findAll();
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.findById(1L));

        assertEquals("Sala não encontrada: 1", exception.getMessage());
        verify(repo).findById(1L);
    }

    @Test
    void createSavesSala() {
        Sala sala = sampleSala();
        when(repo.save(sala)).thenReturn(sala);

        Sala created = service.create(sala);

        assertEquals(sala, created);
        verify(repo, atLeastOnce()).save(sala);
    }

    @Test
    void updateThrowsWhenNotFound() {
        Sala sala = sampleSala();
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.update(1L, sala));

        assertEquals("Sala não encontrada: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void createThrowsWhenResidentialTerrenoAlreadyHasASala() {
        Terreno terreno = Terreno.builder().id(10L).tipo(TipoTerreno.RESIDENCIAL).build();
        Sala existingSala = Sala.builder().id(99L).terreno(terreno).build();
        Sala newSala = Sala.builder().identificacao("Sala 2").terreno(terreno).build();

        when(terrenoRepository.findById(10L)).thenReturn(Optional.of(terreno));
        when(repo.findAll()).thenReturn(List.of(existingSala));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> service.create(newSala));

        assertEquals("Terreno residencial já possui uma sala cadastrada", exception.getMessage());
        verify(repo).findAll();
    }

    @Test
    void updateSavesExistingSala() {
        Sala sala = sampleSala();
        when(repo.existsById(1L)).thenReturn(true);
        when(repo.save(sala)).thenReturn(sala);

        Sala updated = service.update(1L, sala);

        assertEquals(sala, updated);
        assertEquals(1L, updated.getId());
        verify(repo).existsById(1L);
        verify(repo, atLeastOnce()).save(sala);
    }

    @Test
    void deleteThrowsWhenNotFound() {
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.delete(1L));

        assertEquals("Sala não encontrada: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void deleteRemovesExistingSala() {
        when(repo.existsById(1L)).thenReturn(true);
        doNothing().when(repo).deleteById(1L);

        service.delete(1L);

        verify(repo).existsById(1L);
        verify(repo).deleteById(1L);
    }
}
