package com.felicioecavalaro.gestao_aluguel.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto.ContratoReminderDto;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto.PendenciaDto;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PagamentoReminderService {

    private static final List<StatusContrato> ACTIVE_STATUSES = List.of(
            StatusContrato.ATIVO,
            StatusContrato.RENOVADO);

    private static final DateTimeFormatter MONTH_FORMATTER =
            DateTimeFormatter.ofPattern("MMMM/yyyy", new Locale("pt", "BR"));

    private final ContratoRepository contratoRepository;
    private final CobrancaRepository cobrancaRepository;
    private final EmailService emailService;

    @Value("${app.reminder.enabled:true}")
    private boolean reminderEnabled;

    @Scheduled(cron = "${app.reminder.cron:0 0 8 1 * ?}")
    @Transactional(readOnly = true)
    public void sendMonthlyPaymentReminders() {
        if (!reminderEnabled) {
            log.info("Lembretes de pagamento desabilitados em app.reminder.enabled");
            return;
        }

        LocalDate hoje = LocalDate.now();
        YearMonth mesAtual = YearMonth.from(hoje);
        String mesReferencia = capitalize(mesAtual.format(MONTH_FORMATTER));

        List<Contrato> contratosAtivos = contratoRepository.findActiveContractsWithDetails(ACTIVE_STATUSES, hoje);
        if (contratosAtivos.isEmpty()) {
            log.info("Nenhum contrato ativo encontrado para envio de lembretes de pagamento");
            return;
        }

        Map<Long, List<Contrato>> contratosPorLocatario = contratosAtivos.stream()
                .filter(contrato -> contrato.getLocatario() != null && contrato.getLocatario().getId() != null)
                .collect(Collectors.groupingBy(
                        contrato -> contrato.getLocatario().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        int enviados = 0;
        int ignorados = 0;

        for (List<Contrato> contratosDoLocatario : contratosPorLocatario.values()) {
            Locatario locatario = contratosDoLocatario.get(0).getLocatario();
            if (locatario.getEmail() == null || locatario.getEmail().isBlank()) {
                log.warn("Locatário {} sem e-mail cadastrado; lembrete ignorado", locatario.getNome());
                ignorados++;
                continue;
            }

            try {
                PagamentoReminderDto reminder = buildReminder(locatario, contratosDoLocatario, mesAtual, mesReferencia);
                emailService.sendPaymentReminder(reminder);
                enviados++;
            } catch (Exception e) {
                log.error("Falha ao enviar lembrete de pagamento para {}", locatario.getEmail(), e);
            }
        }

        log.info("Lembretes de pagamento processados: {} enviado(s), {} ignorado(s)", enviados, ignorados);
    }

    PagamentoReminderDto buildReminder(
            Locatario locatario,
            List<Contrato> contratos,
            YearMonth mesAtual,
            String mesReferencia) {

        List<ContratoReminderDto> contratoReminders = contratos.stream()
                .map(contrato -> buildContratoReminder(contrato, mesAtual))
                .toList();

        return new PagamentoReminderDto(
                locatario.getNome(),
                locatario.getEmail(),
                mesReferencia,
                contratoReminders);
    }

    private ContratoReminderDto buildContratoReminder(Contrato contrato, YearMonth mesAtual) {
        List<Cobranca> cobrancas = cobrancaRepository.findAllByContratoIdOrderByAnoDescMesDesc(contrato.getId());
        List<PendenciaDto> pendencias = resolvePendencias(contrato, cobrancas, mesAtual);

        String salaIdentificacao = contrato.getSala() != null && contrato.getSala().getIdentificacao() != null
                ? contrato.getSala().getIdentificacao()
                : "Contrato #" + contrato.getId();

        return new ContratoReminderDto(
                salaIdentificacao,
                contrato.getDiaVencimento() != null ? contrato.getDiaVencimento() : 1,
                contrato.getDiaVencimentoAgua(),
                contrato.getDiaVencimentoLuz(),
                contrato.getDiaVencimentoIptu(),
                contrato.getValorAluguel(),
                contrato.getValorCondominio(),
                contrato.getValorIptu(),
                contrato.getValorOutrasDespesas(),
                pendencias);
    }

    private List<PendenciaDto> resolvePendencias(Contrato contrato, List<Cobranca> cobrancas, YearMonth mesAtual) {
        List<PendenciaDto> pendencias = new ArrayList<>();

        Map<YearMonth, Cobranca> cobrancasPorMes = cobrancas.stream()
                .filter(cobranca -> cobranca.getAno() != null && cobranca.getMes() != null)
                .collect(Collectors.toMap(
                        cobranca -> YearMonth.of(cobranca.getAno(), cobranca.getMes()),
                        cobranca -> cobranca,
                        (existing, replacement) -> existing));

        List<YearMonth> mesesCobraveis = resolveMesesCobraveis(contrato, mesAtual);
        for (YearMonth mes : mesesCobraveis) {
            Cobranca cobranca = cobrancasPorMes.get(mes);
            if (cobranca == null) {
                pendencias.add(new PendenciaDto(
                        formatMonth(mes),
                        contrato.getValorAluguel(),
                        "Pagamento não registrado"));
                continue;
            }

            if (cobranca.getStatus() == StatusCobranca.PENDENTE
                    || cobranca.getStatus() == StatusCobranca.INADIMPLENTE) {
                pendencias.add(new PendenciaDto(
                        formatMonth(mes),
                        cobranca.getValor() != null ? cobranca.getValor() : contrato.getValorAluguel(),
                        describeStatus(cobranca.getStatus())));
            }
        }

        pendencias.sort(Comparator.comparing(PendenciaDto::referencia, String.CASE_INSENSITIVE_ORDER));
        return pendencias;
    }

    private List<YearMonth> resolveMesesCobraveis(Contrato contrato, YearMonth mesAtual) {
        YearMonth inicio = YearMonth.from(contrato.getDataInicio());
        YearMonth fim = YearMonth.from(contrato.getDataTermino());
        YearMonth limite = mesAtual.isBefore(fim) ? mesAtual : fim;

        List<YearMonth> meses = new ArrayList<>();
        for (YearMonth mes = inicio; !mes.isAfter(limite); mes = mes.plusMonths(1)) {
            meses.add(mes);
        }
        return meses;
    }

    private String describeStatus(StatusCobranca status) {
        return switch (status) {
            case PENDENTE -> "Pendente";
            case INADIMPLENTE -> "Inadimplente";
            case PAGO -> "Pago";
            case CANCELADO -> "Cancelado";
        };
    }

    private String formatMonth(YearMonth month) {
        return capitalize(month.format(MONTH_FORMATTER));
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }
}
