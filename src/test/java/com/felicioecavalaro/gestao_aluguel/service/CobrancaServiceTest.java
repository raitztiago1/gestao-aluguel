package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class CobrancaServiceTest {
    @Mock
    private CobrancaRepository repo;

    @Mock
    private ContratoRepository contratoRepository;

    @InjectMocks
    private CobrancaService service;

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
    void findAllReturnsAllCobrancas() {
        Cobranca cobranca = sampleCobranca();
        when(repo.findAll()).thenReturn(List.of(cobranca));

        List<Cobranca> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals(cobranca, result.get(0));
        verify(repo).findAll();
    }

    @Test
    void findByIdReturnsCobranca() {
        Cobranca cobranca = sampleCobranca();
        when(repo.findById(1L)).thenReturn(Optional.of(cobranca));

        Cobranca result = service.findById(1L);

        assertEquals(cobranca, result);
        verify(repo).findById(1L);
    }

    @Test
    void findByIdThrowsExceptionWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.findById(1L));
    }

    @Test
    void findByContratoIdReturnsCobrancasForContrato() {
        Cobranca cobranca = sampleCobranca();
        when(repo.findAllByContratoIdOrderByAnoDescMesDesc(1L)).thenReturn(List.of(cobranca));

        List<Cobranca> result = service.findByContratoId(1L);

        assertEquals(1, result.size());
        assertEquals(cobranca, result.get(0));
        verify(repo).findAllByContratoIdOrderByAnoDescMesDesc(1L);
    }

    @Test
    void createSavesCobranca() {
        Cobranca cobranca = sampleCobranca();
        Contrato contrato = Contrato.builder().id(1L).build();

        when(contratoRepository.existsById(1L)).thenReturn(true);
        when(repo.findByContratoIdAndAnoAndMes(1L, 2024, 6)).thenReturn(Optional.empty());
        when(repo.save(any(Cobranca.class))).thenReturn(cobranca);

        Cobranca result = service.create(cobranca);

        assertEquals(cobranca, result);
        verify(repo).save(any(Cobranca.class));
    }

    @Test
    void createThrowsExceptionWhenCobrancaAlreadyExists() {
        Cobranca cobranca = sampleCobranca();

        when(contratoRepository.existsById(1L)).thenReturn(true);
        when(repo.findByContratoIdAndAnoAndMes(1L, 2024, 6)).thenReturn(Optional.of(cobranca));

        assertThrows(IllegalArgumentException.class, () -> service.create(cobranca));
    }

    @Test
    void registerMonthlyStatusCreatesNewCobranca() {
        Cobranca payload = Cobranca.builder()
                .status(StatusCobranca.PAGO)
                .valor(BigDecimal.valueOf(1500))
                .build();

        Contrato contrato = Contrato.builder()
                .id(1L)
                .valorAluguel(BigDecimal.valueOf(1500))
                .build();

        when(contratoRepository.findById(1L)).thenReturn(Optional.of(contrato));
        when(repo.findByContratoIdAndAnoAndMes(1L, 2024, 6)).thenReturn(Optional.empty());
        when(repo.save(any(Cobranca.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cobranca result = service.registerMonthlyStatus(1L, 2024, 6, payload);

        assertEquals(StatusCobranca.PAGO, result.getStatus());
        verify(repo).save(any(Cobranca.class));
    }

    @Test
    void registerMonthlyStatusThrowsExceptionWhenCobrancaAlreadyExists() {
        Cobranca existing = sampleCobranca();
        Cobranca payload = Cobranca.builder()
                .status(StatusCobranca.PAGO)
                .valor(BigDecimal.valueOf(1500))
                .build();
        Contrato contrato = Contrato.builder()
                .id(1L)
                .valorAluguel(BigDecimal.valueOf(1500))
                .build();

        when(contratoRepository.findById(1L)).thenReturn(Optional.of(contrato));
        when(repo.findByContratoIdAndAnoAndMes(1L, 2024, 6)).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> service.registerMonthlyStatus(1L, 2024, 6, payload));
        verify(repo, never()).save(any(Cobranca.class));
    }

    @Test
    void updateSavesExistingCobranca() {
        Cobranca existing = sampleCobranca();
        Cobranca payload = Cobranca.builder()
                .status(StatusCobranca.PAGO)
                .valor(BigDecimal.valueOf(1600))
                .build();

        when(repo.findById(1L)).thenReturn(Optional.of(existing));
        when(repo.save(any(Cobranca.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cobranca result = service.update(1L, payload);

        assertEquals(StatusCobranca.PAGO, result.getStatus());
        assertEquals(BigDecimal.valueOf(1600), result.getValor());
        verify(repo).save(any(Cobranca.class));
    }

    @Test
    void deleteRemovesExistingCobranca() {
        when(repo.existsById(1L)).thenReturn(true);

        service.delete(1L);

        verify(repo).deleteById(1L);
    }

    @Test
    void deleteThrowsExceptionWhenNotFound() {
        when(repo.existsById(1L)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> service.delete(1L));
    }
}
