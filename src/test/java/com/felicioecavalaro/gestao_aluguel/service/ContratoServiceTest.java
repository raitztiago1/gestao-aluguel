package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class ContratoServiceTest {

    @Mock
    private ContratoRepository repo;

    @Mock
    private SalaRepository salaRepository;

    @Mock
    private CobrancaRepository cobrancaRepository;

    @InjectMocks
    private ContratoService service;

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
    void findAllReturnsList() {
        Contrato contrato = sampleContrato();
        when(repo.findAll()).thenReturn(List.of(contrato));

        List<Contrato> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals(contrato, result.get(0));
        verify(repo).findAll();
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.findById(1L));

        assertEquals("Contrato não encontrado: 1", exception.getMessage());
        verify(repo).findById(1L);
    }

    @Test
    void createSavesContrato() {
        Contrato contrato = sampleContrato();
        when(repo.save(contrato)).thenReturn(contrato);

        Contrato created = service.create(contrato);

        assertEquals(contrato, created);
        verify(repo).save(contrato);
    }

    @Test
    void findAllMarksContratoAsEmAbertoBeforeDueDateWhenNoPaymentExists() {
        LocalDate hoje = LocalDate.now();
        int diaVencimento = Math.min(hoje.getDayOfMonth() + 1, hoje.lengthOfMonth());
        Contrato contrato = Contrato.builder()
                .id(1L)
                .diaVencimento(diaVencimento)
                .build();

        when(repo.findAll()).thenReturn(List.of(contrato));
        when(cobrancaRepository.findAllByContratoIdOrderByAnoDescMesDesc(1L)).thenReturn(List.of());

        List<Contrato> result = service.findAll();

        assertEquals("EM_ABERTO", result.get(0).getSituacao());
    }

    @Test
    void createThrowsWhenSalaAlreadyHasAnActiveContractInThePeriod() {
        Contrato contrato = sampleContrato();
        Sala sala = new Sala();
        sala.setId(1L);
        contrato.setSala(sala);
        Contrato existing = Contrato.builder()
                .id(2L)
                .sala(sala)
                .dataInicio(LocalDate.now().minusDays(10))
                .dataTermino(LocalDate.now().plusDays(10))
                .status(StatusContrato.ATIVO)
                .build();

        when(repo.findBySalaId(1L)).thenReturn(List.of(existing));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.create(contrato));

        assertEquals("Sala já possui um contrato ativo no período informado.", exception.getMessage());
    }

    @Test
    void updateThrowsWhenNotFound() {
        Contrato contrato = sampleContrato();
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> service.update(1L, contrato));

        assertEquals("Contrato não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void updateSavesExistingContrato() {
        Contrato contrato = sampleContrato();
        when(repo.existsById(1L)).thenReturn(true);
        when(repo.save(any(Contrato.class))).thenReturn(contrato);

        Contrato updated = service.update(1L, contrato);

        assertEquals(contrato, updated);
        assertEquals(1L, updated.getId());
        verify(repo).existsById(1L);
        verify(repo).save(contrato);
    }

    @Test
    void deleteThrowsWhenNotFound() {
        when(repo.existsById(1L)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> service.delete(1L));

        assertEquals("Contrato não encontrado: 1", exception.getMessage());
        verify(repo).existsById(1L);
    }

    @Test
    void deleteRemovesExistingContrato() {
        when(repo.existsById(1L)).thenReturn(true);
        when(repo.findById(1L)).thenReturn(Optional.of(sampleContrato()));
        doNothing().when(repo).deleteById(1L);

        service.delete(1L);

        verify(repo).existsById(1L);
        verify(repo).deleteById(1L);
    }
}
