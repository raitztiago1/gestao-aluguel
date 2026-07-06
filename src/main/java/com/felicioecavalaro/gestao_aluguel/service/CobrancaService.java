package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CobrancaService {
    private final CobrancaRepository repo;
    private final ContratoRepository contratoRepository;

    public List<Cobranca> findAll() {
        return repo.findAll();
    }

    public Cobranca findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Cobrança não encontrada: " + id));
    }

    public List<Cobranca> findByContratoId(Long contratoId) {
        return repo.findAllByContratoIdOrderByAnoDescMesDesc(contratoId);
    }

    @Transactional
    public Cobranca create(Cobranca cobranca) {
        validateCobranca(cobranca);

        Integer ano = cobranca.getAno();
        Integer mes = cobranca.getMes();
        Long contratoId = cobranca.getContrato().getId();

        if (repo.findByContratoIdAndAnoAndMes(contratoId, ano, mes).isPresent()) {
            throw new IllegalArgumentException("Cobrança já existe para contrato, ano e mês informados.");
        }

        configureAuditFields(cobranca, true);
        return repo.save(cobranca);
    }

    @Transactional
    public Cobranca update(Long id, Cobranca cobranca) {
        Cobranca existing = findById(id);

        if (cobranca.getStatus() != null) {
            existing.setStatus(cobranca.getStatus());
        }
        if (cobranca.getValor() != null) {
            existing.setValor(cobranca.getValor());
        }
        if (cobranca.getDataPagamento() != null) {
            existing.setDataPagamento(cobranca.getDataPagamento());
        }
        existing.setObservacoes(cobranca.getObservacoes());

        if (existing.getStatus() == StatusCobranca.PAGO && existing.getDataPagamento() == null) {
            existing.setDataPagamento(LocalDate.now());
        }
        if (existing.getStatus() != StatusCobranca.PAGO) {
            existing.setDataPagamento(null);
        }

        validatePeriodoContrato(existing.getContrato(), existing.getAno(), existing.getMes());
        validateDataPagamentoContrato(existing.getContrato(), existing.getDataPagamento());
        configureAuditFields(existing, false);
        return repo.save(existing);
    }

    @Transactional
    public Cobranca registerMonthlyStatus(Long contratoId, Integer ano, Integer mes, Cobranca payload) {
        if (payload == null || payload.getStatus() == null) {
            throw new IllegalArgumentException("Status da cobrança deve ser informado.");
        }
        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado: " + contratoId));

        validatePeriodoContrato(contrato, ano, mes);

        if (repo.findByContratoIdAndAnoAndMes(contratoId, ano, mes).isPresent()) {
            throw new IllegalArgumentException(
                    "Pagamento ja existe para este contrato no periodo informado. Use a edicao para alterar.");
        }

        Cobranca cobranca = Cobranca.builder()
                .contrato(contrato)
                .ano(ano)
                .mes(mes)
                .build();

        cobranca.setStatus(payload.getStatus());
        cobranca.setValor(payload.getValor() != null ? payload.getValor() : contrato.getValorAluguel());
        cobranca.setDataPagamento(payload.getDataPagamento() != null ? payload.getDataPagamento()
                : payload.getStatus() == StatusCobranca.PAGO ? LocalDate.now() : null);
        validateDataPagamentoContrato(contrato, cobranca.getDataPagamento());
        cobranca.setObservacoes(payload.getObservacoes());
        configureAuditFields(cobranca, cobranca.getId() == null);
        return repo.save(cobranca);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Cobrança não encontrada: " + id);
        }
        repo.deleteById(id);
    }

    private void validateCobranca(Cobranca cobranca) {
        if (cobranca == null || cobranca.getContrato() == null || cobranca.getContrato().getId() == null) {
            throw new IllegalArgumentException("Contrato deve ser informado na cobrança.");
        }
        if (cobranca.getAno() == null || cobranca.getMes() == null) {
            throw new IllegalArgumentException("Ano e mês devem ser informados na cobrança.");
        }
        if (cobranca.getMes() < 1 || cobranca.getMes() > 12) {
            throw new IllegalArgumentException("Mês inválido na cobrança. Deve estar entre 1 e 12.");
        }
        if (cobranca.getStatus() == null) {
            throw new IllegalArgumentException("Status da cobrança deve ser informado.");
        }
        if (!contratoRepository.existsById(cobranca.getContrato().getId())) {
            throw new EntityNotFoundException("Contrato não encontrado: " + cobranca.getContrato().getId());
        }
    }

    private void validatePeriodoContrato(Contrato contrato, Integer ano, Integer mes) {
        if (contrato == null || ano == null || mes == null) {
            return;
        }

        YearMonth periodo = YearMonth.of(ano, mes);
        if (contrato.getDataInicio() != null && periodo.isBefore(YearMonth.from(contrato.getDataInicio()))) {
            throw new IllegalArgumentException("Periodo do pagamento nao pode ser anterior ao inicio do contrato.");
        }
        if (contrato.getDataTermino() != null && periodo.isAfter(YearMonth.from(contrato.getDataTermino()))) {
            throw new IllegalArgumentException("Periodo do pagamento nao pode ser posterior ao termino do contrato.");
        }
        if (periodo.isAfter(YearMonth.now())) {
            throw new IllegalArgumentException("Periodo do pagamento nao pode ser posterior ao mes atual.");
        }
    }

    private void validateDataPagamentoContrato(Contrato contrato, LocalDate dataPagamento) {
        if (dataPagamento == null) {
            return;
        }
        if (contrato != null && contrato.getDataInicio() != null && dataPagamento.isBefore(contrato.getDataInicio())) {
            throw new IllegalArgumentException("Data de pagamento nao pode ser anterior ao inicio do contrato.");
        }
        if (dataPagamento.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Data de pagamento nao pode ser posterior a hoje.");
        }
    }

    private void configureAuditFields(Cobranca cobranca, boolean isCreate) {
        LocalDateTime now = LocalDateTime.now();
        if (isCreate) {
            cobranca.setCreatedAt(now);
        }
        cobranca.setUpdatedAt(now);
    }
}
