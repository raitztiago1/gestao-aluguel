package com.felicioecavalaro.gestao_aluguel.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Redefinição de senha - Gestão de Aluguel");
        message.setText(buildEmailBody(nome, resetLink));

        mailSender.send(message);
        log.info("Email de redefinição de senha enviado para: {}", to);
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
}
