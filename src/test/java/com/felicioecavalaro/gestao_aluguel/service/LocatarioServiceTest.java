package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.repository.LocatarioRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class LocatarioServiceTest {

    @Mock
    private LocatarioRepository repo;

    @InjectMocks
    private LocatarioService service;

    private Locatario sampleLocatario() {
        return Locatario.builder()
                .id(1L)
                .nome("Teste Locatario")
                .build();
    }

    @Test
    void findAllReturnsList() {
        Locatario locatario = sampleLocatario();
        when(repo.findAll()).thenReturn(List.of(locatario));

        List<Locatario> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals(locatario, result.get(0));
        verify(repo).findAll();
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.findById(1L));

        assertEquals("Locatário não encontrado: 1", exception.getMessage());
        verify(repo).findById(1L);
    }

    @Test
    void createSavesLocatario() {
        Locatario locatario = sampleLocatario();
        when(repo.save(locatario)).thenReturn(locatario);

        Locatario created = service.create(locatario);

        assertEquals(locatario, created);
        verify(repo).save(locatario);
    }

    @Test
    void updateThrowsWhenNotFound() {
        Locatario locatario = sampleLocatario();
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> service.update(1L, locatario));

        assertEquals("Locatário não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void updateSavesExistingLocatario() {
        Locatario locatario = sampleLocatario();
        when(repo.existsById(1L)).thenReturn(true);
        when(repo.save(locatario)).thenReturn(locatario);

        Locatario updated = service.update(1L, locatario);

        assertEquals(locatario, updated);
        assertEquals(1L, updated.getId());
        verify(repo).existsById(1L);
        verify(repo).save(locatario);
    }

    @Test
    void deleteThrowsWhenNotFound() {
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.delete(1L));

        assertEquals("Locatário não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void deleteRemovesExistingLocatario() {
        when(repo.existsById(1L)).thenReturn(true);
        doNothing().when(repo).deleteById(1L);

        service.delete(1L);

        verify(repo).existsById(1L);
        verify(repo).deleteById(1L);
    }
}
