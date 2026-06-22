package com.felicioecavalaro.gestao_aluguel.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseBackupService {

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.backup.enabled:true}")
    private boolean backupEnabled;

    @Value("${app.backup.directory:backups}")
    private String backupDirectory;

    @Value("${app.backup.file-prefix:gestao-aluguel-backup}")
    private String backupFilePrefix;

    @Scheduled(cron = "${app.backup.cron:0 0 0 1 * ?}")
    public void createAndSendMonthlyBackup() {
        if (!backupEnabled) {
            log.info("Backup automático desabilitado em app.backup.enabled");
            return;
        }

        try {
            File backupFile = createDatabaseBackupFile();
            List<String> recipients = usuarioRepository.findAll().stream()
                    .map(Usuario::getEmail)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            if (recipients.isEmpty()) {
                log.warn("Nenhum usuário com e-mail encontrado para envio do backup mensal");
                return;
            }

            emailService.sendDatabaseBackup(recipients, backupFile, LocalDateTime.now());
            log.info("Backup mensal enviado para {} destinatário(s)", recipients.size());
        } catch (Exception e) {
            log.error("Falha ao gerar ou enviar backup mensal", e);
        }
    }

    private File createDatabaseBackupFile() throws IOException, InterruptedException {
        BackupConnectionInfo connectionInfo = parseJdbcUrl(datasourceUrl);
        Path backupFolder = Path.of(backupDirectory);
        Files.createDirectories(backupFolder);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        Path backupFile = backupFolder.resolve(backupFilePrefix + "-" + timestamp + ".dump");

        ProcessBuilder processBuilder = new ProcessBuilder(
                "pg_dump",
                "--host", connectionInfo.host(),
                "--port", String.valueOf(connectionInfo.port()),
                "--username", datasourceUsername,
                "--format=custom",
                "--file", backupFile.toString(),
                connectionInfo.database());

        processBuilder.environment().put("PGPASSWORD", datasourcePassword);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new IOException("pg_dump retornou código " + exitCode + ": " + output);
        }

        log.info("Backup do banco de dados gerado em {}", backupFile.toAbsolutePath());
        return backupFile.toFile();
    }

    private BackupConnectionInfo parseJdbcUrl(String url) {
        Pattern pattern = Pattern.compile("^jdbc:postgresql://([^:/]+)(?::(\\d+))?/(.+)$");
        Matcher matcher = pattern.matcher(url);
        if (!matcher.find()) {
            throw new IllegalArgumentException("URL JDBC inválida para PostgreSQL: " + url);
        }

        String host = matcher.group(1);
        int port = matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 5432;
        String database = matcher.group(3).split("\\?")[0];

        return new BackupConnectionInfo(host, port, database);
    }

    private record BackupConnectionInfo(String host, int port, String database) {
    }
}
