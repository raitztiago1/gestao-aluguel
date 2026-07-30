package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.ContratoDocumento;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoDocumentoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

@Service
public class ContratoDocumentoService {

    private static final byte[] PDF_MAGIC = new byte[] { '%', 'P', 'D', 'F', '-' };

    private final ContratoDocumentoRepository repository;
    private final ContratoRepository contratoRepository;

    @Value("${app.upload.max-file-size:10485760}")
    private long maxFileSize;

    public ContratoDocumentoService(ContratoDocumentoRepository repository, ContratoRepository contratoRepository) {
        this.repository = repository;
        this.contratoRepository = contratoRepository;
    }

    @Transactional
    public ContratoDocumento store(Long contratoId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("Arquivo excede o tamanho máximo permitido");
        }

        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new IllegalArgumentException("Apenas arquivos PDF são permitidos");
        }

        byte[] content = file.getBytes();
        validatePdfMagicBytes(content);

        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new IllegalArgumentException("Contrato não encontrado"));

        ContratoDocumento doc = ContratoDocumento.builder()
                .contrato(contrato)
                .nomeArquivo(file.getOriginalFilename())
                .contentType(file.getContentType())
                .conteudo(content)
                .tamanho(content.length)
                .uploadedAt(LocalDateTime.now())
                .build();

        return repository.save(doc);
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "contrato.pdf";
        }
        String sanitized = filename.replace("\"", "")
                .replace("\\", "")
                .replace("\r", "")
                .replace("\n", "");
        return sanitized.isBlank() ? "contrato.pdf" : sanitized;
    }

    private void validatePdfMagicBytes(byte[] content) {
        if (content == null || content.length < PDF_MAGIC.length) {
            throw new IllegalArgumentException("Arquivo não é um PDF válido");
        }
        for (int i = 0; i < PDF_MAGIC.length; i++) {
            if (content[i] != PDF_MAGIC[i]) {
                throw new IllegalArgumentException("Arquivo não é um PDF válido");
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<ContratoDocumento> findLatestByContrato(Long contratoId) {
        return repository.findTopByContratoIdOrderByUploadedAtDesc(contratoId);
    }

    @Transactional
    public void deleteByContratoId(Long contratoId) {
        repository.deleteByContratoId(contratoId);
    }
}
