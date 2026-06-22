package com.felicioecavalaro.gestao_aluguel.service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.StreamSupport;

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
            log.info("Email de backup mensal enviado com anexo {} para {} destinatário(s)", attachment.getName(), countRecipients(recipients));
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
