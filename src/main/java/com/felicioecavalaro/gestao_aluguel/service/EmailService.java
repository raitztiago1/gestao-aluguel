package com.felicioecavalaro.gestao_aluguel.service;

import java.io.File;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.StreamSupport;

import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto.ContratoReminderDto;
import com.felicioecavalaro.gestao_aluguel.dto.PagamentoReminderDto.PendenciaDto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:no-reply@gestao-aluguel.local}")
    private String fromAddress;

    public void sendPasswordResetEmail(String to, String nome, String resetLink) {
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Redefinição de senha - Gestão de Aluguel");
            helper.setText(buildEmailBody(nome, resetLink), false);

            mailSender.send(message);
            log.info("Email de redefinição de senha enviado para: {}", to);
        } catch (MessagingException e) {
            log.error("Falha ao enviar email de redefinição de senha para: {}", to, e);
            throw new RuntimeException("Falha ao enviar email de redefinição de senha", e);
        }
    }

    public void sendPaymentReminder(PagamentoReminderDto reminder) {
        if (reminder == null || reminder.locatarioEmail() == null || reminder.locatarioEmail().isBlank()) {
            return;
        }

        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(reminder.locatarioEmail().trim());
            helper.setSubject("Lembrete de pagamento - Gestão de Aluguel");
            helper.setText(buildPaymentReminderBody(reminder), false);

            mailSender.send(message);
            log.info("Lembrete de pagamento enviado para: {}", reminder.locatarioEmail());
        } catch (MessagingException e) {
            log.error("Falha ao enviar lembrete de pagamento para: {}", reminder.locatarioEmail(), e);
            throw new RuntimeException("Falha ao enviar lembrete de pagamento", e);
        }
    }

    public void sendDatabaseBackup(Iterable<String> recipients, File attachment, LocalDateTime backupDate) {
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setBcc(toArray(recipients));
            helper.setSubject("Backup mensal do banco de dados - Gestão de Aluguel");
            helper.setText(buildBackupEmailBody(backupDate), false);
            helper.addAttachment(attachment.getName(), attachment);

            mailSender.send(message);
            log.info("Email de backup mensal enviado com anexo {} para {} destinatário(s)", attachment.getName(),
                    countRecipients(recipients));
        } catch (MessagingException e) {
            log.error("Falha ao enviar o email de backup mensal", e);
            throw new RuntimeException("Falha ao enviar o email de backup mensal", e);
        }
    }

    private String[] toArray(Iterable<String> recipients) {
        return StreamSupport.stream(recipients.spliterator(), false)
                .filter(email -> email != null && !email.isBlank())
                .toArray(String[]::new);
    }

    private long countRecipients(Iterable<String> recipients) {
        return StreamSupport.stream(recipients.spliterator(), false)
                .filter(email -> email != null && !email.isBlank())
                .count();
    }

    private String buildEmailBody(String nome, String resetLink) {
        String displayName = (nome == null || nome.isBlank()) ? "usuário" : nome.trim();
        return String.join("\n", new String[] {
                String.format("Olá %s,", displayName),
                "",
                "Recebemos uma solicitação para redefinir sua senha.",
                "Clique no link abaixo para continuar:",
                resetLink,
                "",
                "Se você não solicitou a redefinição de senha, ignore esta mensagem.",
                "",
                "Atenciosamente,",
                "Equipe Gestão de Aluguel"
        });
    }

    private String buildPaymentReminderBody(PagamentoReminderDto reminder) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        String displayName = (reminder.locatarioNome() == null || reminder.locatarioNome().isBlank())
                ? "locatário"
                : reminder.locatarioNome().trim();

        StringBuilder body = new StringBuilder();
        body.append(String.format("Olá %s,", displayName)).append("\n\n");
        body.append(String.format("Este é o lembrete mensal dos seus pagamentos referentes a %s.",
                reminder.mesReferencia())).append("\n\n");

        for (ContratoReminderDto contrato : reminder.contratos()) {
            body.append("--- ").append(contrato.salaIdentificacao()).append(" ---\n\n");
            body.append("Datas de vencimento:\n");
            body.append(String.format("- Aluguel: dia %02d", contrato.diaVencimentoAluguel())).append("\n");
            appendDueDateLine(body, "Água", contrato.diaVencimentoAgua());
            appendDueDateLine(body, "Luz", contrato.diaVencimentoLuz());
            appendDueDateLine(body, "IPTU", contrato.diaVencimentoIptu());
            body.append("\nValores:\n");
            body.append(String.format("- Aluguel: %s", formatCurrency(currency, contrato.valorAluguel()))).append("\n");
            appendValueLine(body, currency, "Condomínio", contrato.valorCondominio());
            appendValueLine(body, currency, "IPTU", contrato.valorIptu());
            appendValueLine(body, currency, "Outras despesas", contrato.valorOutrasDespesas());
            body.append("\n");

            List<PendenciaDto> pendencias = contrato.pendencias();
            if (pendencias.isEmpty()) {
                body.append("Pendências: nenhuma pendência registrada.\n\n");
            } else {
                body.append("Pendências em aberto:\n");
                for (PendenciaDto pendencia : pendencias) {
                    body.append(String.format("- %s: %s (%s)",
                            pendencia.referencia(),
                            formatCurrency(currency, pendencia.valor()),
                            pendencia.descricao())).append("\n");
                }
                body.append("\n");
            }
        }

        body.append("Em caso de dúvidas, entre em contato com a administração.\n\n");
        body.append("Atenciosamente,\n");
        body.append("Equipe Gestão de Aluguel");
        return body.toString();
    }

    private void appendDueDateLine(StringBuilder body, String label, Integer day) {
        if (day != null) {
            body.append(String.format("- %s: dia %02d", label, day)).append("\n");
        }
    }

    private void appendValueLine(StringBuilder body, NumberFormat currency, String label, BigDecimal value) {
        if (value != null && value.signum() > 0) {
            body.append(String.format("- %s: %s", label, formatCurrency(currency, value))).append("\n");
        }
    }

    private String formatCurrency(NumberFormat currency, BigDecimal value) {
        if (value == null) {
            return currency.format(BigDecimal.ZERO);
        }
        return currency.format(value);
    }

    private String buildBackupEmailBody(LocalDateTime backupDate) {
        return String.join("\n", new String[] {
                "Olá,",
                "",
                String.format("O backup mensal do banco de dados foi gerado em %s.",
                        backupDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))),
                "O arquivo está anexado a este email.",
                "",
                "Atenciosamente,",
                "Equipe Gestão de Aluguel"
        });
    }
}
