package com.felicioecavalaro.gestao_aluguel.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.felicioecavalaro.gestao_aluguel.service.ContratoDocumentoService;

@RestController
@RequestMapping("/api/contratos")
public class ContratoDocumentoController {
    private final ContratoDocumentoService service;

    public ContratoDocumentoController(ContratoDocumentoService service) {
        this.service = service;
    }

    @PostMapping(value = "/{id}/documento", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocumento(@PathVariable("id") Long contratoId,
            @RequestPart("file") MultipartFile file) {
        try {
            service.store(contratoId, file);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/documento")
    public ResponseEntity<?> downloadDocumento(@PathVariable("id") Long contratoId) {
        try {
            var doc = service.findLatestByContrato(contratoId);
            if (doc.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            var documento = doc.get();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + documento.getNomeArquivo() + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(documento.getConteudo());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao buscar arquivo");
        }
    }

    @DeleteMapping("/{id}/documento")
    public ResponseEntity<?> deleteDocumento(@PathVariable("id") Long contratoId) {
        try {
            service.deleteByContratoId(contratoId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao deletar arquivo");
        }
    }
}
