package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.ContratoDocumento;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoDocumentoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

@Service
public class ContratoDocumentoService {
    private final ContratoDocumentoRepository repository;
    private final ContratoRepository contratoRepository;

    public ContratoDocumentoService(ContratoDocumentoRepository repository, ContratoRepository contratoRepository) {
        this.repository = repository;
        this.contratoRepository = contratoRepository;
    }

    @Transactional
    public ContratoDocumento store(Long contratoId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        if (!file.getContentType().equalsIgnoreCase("application/pdf")) {
            throw new IllegalArgumentException("Apenas arquivos PDF são permitidos");
        }

        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new IllegalArgumentException("Contrato não encontrado"));

        ContratoDocumento doc = ContratoDocumento.builder()
                .contrato(contrato)
                .nomeArquivo(file.getOriginalFilename())
                .contentType(file.getContentType())
                .conteudo(file.getBytes())
                .tamanho((int) file.getSize())
                .uploadedAt(LocalDateTime.now())
                .build();

        return repository.save(doc);
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
