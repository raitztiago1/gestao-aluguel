package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCobranca;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto;
import com.felicioecavalaro.gestao_aluguel.repository.CobrancaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

@ExtendWith(MockitoExtension.class)
class PagamentoReminderServiceTest {

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private CobrancaRepository cobrancaRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PagamentoReminderService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "reminderEnabled", true);
    }

    @Test
    void sendMonthlyPaymentRemindersSendsEmailForActiveContracts() {
        LocalDate hoje = LocalDate.now();
        Locatario locatario = Locatario.builder()
                .id(1L)
                .nome("Maria Silva")
                .email("maria@example.com")
                .build();
        Sala sala = Sala.builder().identificacao("Sala 101").build();
        Contrato contrato = Contrato.builder()
                .id(10L)
                .locatario(locatario)
                .sala(sala)
                .status(StatusContrato.ATIVO)
                .dataInicio(hoje.minusMonths(2))
                .dataTermino(hoje.plusMonths(10))
                .valorAluguel(BigDecimal.valueOf(1500))
                .diaVencimento(5)
                .build();

        when(contratoRepository.findActiveContractsWithDetails(any(), any())).thenReturn(List.of(contrato));
        when(cobrancaRepository.findAllByContratoIdOrderByAnoDescMesDesc(10L)).thenReturn(List.of());

        service.sendMonthlyPaymentReminders();

        verify(emailService).sendPaymentReminder(any(PagamentoReminderDto.class));
    }

    @Test
    void sendMonthlyPaymentRemindersSkipsWhenDisabled() {
        ReflectionTestUtils.setField(service, "reminderEnabled", false);

        service.sendMonthlyPaymentReminders();

        verify(contratoRepository, never()).findActiveContractsWithDetails(any(), any());
        verify(emailService, never()).sendPaymentReminder(any());
    }

    @Test
    void buildReminderIncludesOutstandingCharges() {
        LocalDate hoje = LocalDate.now();
        YearMonth mesAtual = YearMonth.from(hoje);
        YearMonth mesAnterior = mesAtual.minusMonths(1);

        Locatario locatario = Locatario.builder()
                .id(1L)
                .nome("João Souza")
                .email("joao@example.com")
                .build();
        Sala sala = Sala.builder().identificacao("Sala 202").build();
        Contrato contrato = Contrato.builder()
                .id(20L)
                .locatario(locatario)
                .sala(sala)
                .status(StatusContrato.ATIVO)
                .dataInicio(hoje.minusMonths(3))
                .dataTermino(hoje.plusMonths(9))
                .valorAluguel(BigDecimal.valueOf(2000))
                .diaVencimento(10)
                .diaVencimentoAgua(15)
                .build();

        Cobranca cobrancaInadimplente = Cobranca.builder()
                .ano(mesAnterior.getYear())
                .mes(mesAnterior.getMonthValue())
                .valor(BigDecimal.valueOf(2000))
                .status(StatusCobranca.INADIMPLENTE)
                .build();

        when(cobrancaRepository.findAllByContratoIdOrderByAnoDescMesDesc(20L))
                .thenReturn(List.of(cobrancaInadimplente));

        PagamentoReminderDto reminder = service.buildReminder(
                locatario,
                List.of(contrato),
                mesAtual,
                "Julho/2026");

        assertEquals("João Souza", reminder.locatarioNome());
        assertEquals("joao@example.com", reminder.locatarioEmail());
        assertEquals(1, reminder.contratos().size());

        var contratoReminder = reminder.contratos().get(0);
        assertEquals("Sala 202", contratoReminder.salaIdentificacao());
        assertEquals(10, contratoReminder.diaVencimentoAluguel());
        assertEquals(15, contratoReminder.diaVencimentoAgua());
        assertTrue(contratoReminder.pendencias().size() >= 2);
        assertTrue(contratoReminder.pendencias().stream()
                .anyMatch(p -> p.descricao().equals("Inadimplente")));
        assertTrue(contratoReminder.pendencias().stream()
                .anyMatch(p -> p.descricao().equals("Pagamento não registrado")));
    }
}
