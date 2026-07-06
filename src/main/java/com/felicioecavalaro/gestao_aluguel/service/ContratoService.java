package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusSala;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContratoService {

    private static final List<StatusContrato> ACTIVE_STATUSES = List.of(
            StatusContrato.ATIVO,
            StatusContrato.RENOVADO);

    private final ContratoRepository repo;
    private final SalaRepository salaRepository;
    private final CobrancaRepository cobrancaRepository;

    public List<Contrato> findAll() {
        List<Contrato> contratos = repo.findAll();
        contratos.forEach(this::enrichContrato);
        return contratos;
    }

    public Contrato findById(Long id) {
        Contrato contrato = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado: " + id));
        enrichContrato(contrato);
        return contrato;
    }

    @Transactional
    public Contrato create(Contrato contrato) {
        validateSalaAvailability(contrato);
        Contrato saved = repo.save(contrato);
        enrichContrato(saved);
        syncSalaStatus(saved);
        return saved;
    }

    @Transactional
    public Contrato update(Long id, Contrato contrato) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Contrato não encontrado: " + id);
        }
        validateSalaAvailability(contrato, id);
        contrato.setId(id);
        Contrato saved = repo.save(contrato);
        enrichContrato(saved);
        syncSalaStatus(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Contrato não encontrado: " + id);
        }

        Long salaId = null;
        Contrato contrato = repo.findById(id).orElse(null);
        if (contrato != null && contrato.getSala() != null) {
            salaId = contrato.getSala().getId();
        }

        repo.deleteById(id);
        if (salaId != null) {
            syncSalaStatus(salaId);
        }
    }

    private void validateSalaAvailability(Contrato contrato) {
        validateSalaAvailability(contrato, null);
    }

    private void validateSalaAvailability(Contrato contrato, Long currentContratoId) {
        if (contrato == null || contrato.getSala() == null || contrato.getSala().getId() == null) {
            return;
        }
        if (contrato.getDataInicio() == null || contrato.getDataTermino() == null) {
            return;
        }
        boolean hasOverlap = repo.findBySalaId(contrato.getSala().getId()).stream()
                .filter(existing -> existing.getId() == null || !existing.getId().equals(currentContratoId))
                .filter(existing -> existing.getStatus() == StatusContrato.ATIVO
                        || existing.getStatus() == StatusContrato.RENOVADO)
                .filter(existing -> existing.getDataInicio() != null && existing.getDataTermino() != null)
                .anyMatch(existing -> !contrato.getDataTermino().isBefore(existing.getDataInicio())
                        && !contrato.getDataInicio().isAfter(existing.getDataTermino()));

        if (hasOverlap) {
            throw new IllegalStateException("Sala já possui um contrato ativo no período informado.");
        }
    }

    private void enrichContrato(Contrato contrato) {
        if (contrato == null) {
            return;
        }
        contrato.setSituacao(resolveSituacao(contrato));
        contrato.setEmDia("EM_DIA".equals(contrato.getSituacao()));
    }

    private String resolveSituacao(Contrato contrato) {
        if (contrato == null || contrato.getId() == null || contrato.getDiaVencimento() == null) {
            return "EM_ABERTO";
        }

        if (contrato.getStatus() == null || !ACTIVE_STATUSES.contains(contrato.getStatus())) {
            return "EM_ABERTO";
        }

        LocalDate hoje = LocalDate.now();
        if (contrato.getDataInicio() == null || contrato.getDataTermino() == null) {
            return "EM_ABERTO";
        }
        if (hoje.isBefore(contrato.getDataInicio())) {
            return "EM_ABERTO";
        }
        if (hoje.isAfter(contrato.getDataTermino())) {
            return "EM_ABERTO";
        }

        YearMonth mesAtual = YearMonth.from(hoje);
        YearMonth inicio = YearMonth.from(contrato.getDataInicio());
        YearMonth fim = YearMonth.from(contrato.getDataTermino());
        YearMonth limite = mesAtual.isBefore(fim) ? mesAtual : fim;

        Map<YearMonth, Cobranca> cobrancasPorMes = cobrancaRepository
                .findAllByContratoIdOrderByAnoDescMesDesc(contrato.getId()).stream()
                .filter(cobranca -> cobranca.getAno() != null && cobranca.getMes() != null)
                .collect(Collectors.toMap(
                        cobranca -> YearMonth.of(cobranca.getAno(), cobranca.getMes()),
                        cobranca -> cobranca,
                        (existing, replacement) -> existing));

        boolean temAtraso = false;
        boolean temAberto = false;

        for (YearMonth mes = inicio; !mes.isAfter(limite); mes = mes.plusMonths(1)) {
            Cobranca cobranca = cobrancasPorMes.get(mes);
            if (cobranca != null && cobranca.getStatus() == StatusCobranca.PAGO) {
                continue;
            }

            LocalDate dataLimite = calcularDataLimitePagamento(contrato, mes);
            if (hoje.isAfter(dataLimite)) {
                temAtraso = true;
            } else {
                temAberto = true;
            }
        }

        if (temAtraso) {
            return "EM_ATRASO";
        }
        if (temAberto) {
            return "EM_ABERTO";
        }
        return "EM_DIA";
    }

    private LocalDate calcularDataLimitePagamento(Contrato contrato, YearMonth mesReferencia) {
        int diaVencimento = contrato.getDiaVencimento();
        int diaLimite = Math.min(diaVencimento, mesReferencia.lengthOfMonth());
        LocalDate dataLimite = mesReferencia.atDay(diaLimite);

        YearMonth mesInicioContrato = YearMonth.from(contrato.getDataInicio());
        if (mesReferencia.equals(mesInicioContrato) && dataLimite.isBefore(contrato.getDataInicio())) {
            YearMonth proximoMes = mesReferencia.plusMonths(1);
            int diaNoProximoMes = Math.min(diaVencimento, proximoMes.lengthOfMonth());
            return proximoMes.atDay(diaNoProximoMes);
        }

        return dataLimite;
    }

    private void syncSalaStatus(Contrato contrato) {
        if (contrato == null || contrato.getSala() == null || contrato.getSala().getId() == null) {
            return;
        }
        syncSalaStatus(contrato.getSala().getId());
    }

    private void syncSalaStatus(Long salaId) {
        Sala sala = salaRepository.findById(salaId).orElse(null);
        if (sala == null || sala.getStatus() == StatusSala.MANUTENCAO) {
            return;
        }

        boolean occupied = repo.findBySalaId(salaId).stream()
                .filter(existing -> existing.getDataInicio() != null && existing.getDataTermino() != null)
                .filter(existing -> existing.getStatus() == StatusContrato.ATIVO
                        || existing.getStatus() == StatusContrato.RENOVADO)
                .anyMatch(existing -> !LocalDate.now().isBefore(existing.getDataInicio())
                        && !LocalDate.now().isAfter(existing.getDataTermino()));

        sala.setStatus(occupied ? StatusSala.LOCADA : StatusSala.DISPONIVEL);
        salaRepository.save(sala);
    }
}
