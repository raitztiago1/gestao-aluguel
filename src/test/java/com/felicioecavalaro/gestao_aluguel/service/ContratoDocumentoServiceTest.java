package com.felicioecavalaro.gestao_aluguel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.ContratoDocumento;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoDocumentoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

@ExtendWith(MockitoExtension.class)
class ContratoDocumentoServiceTest {

    @Mock
    private ContratoDocumentoRepository repository;

    @Mock
    private ContratoRepository contratoRepository;

    @InjectMocks
    private ContratoDocumentoService service;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "maxFileSize", 10485760L);
    }

    @Test
    void storeAcceptsValidPdf() throws Exception {
        Contrato contrato = Contrato.builder().id(1L).build();
        byte[] pdfContent = "%PDF-1.4 valid content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "contrato.pdf", "application/pdf", pdfContent);

        when(contratoRepository.findById(1L)).thenReturn(Optional.of(contrato));
        when(repository.save(any(ContratoDocumento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContratoDocumento result = service.store(1L, file);

        assertNotNull(result);
        assertEquals("contrato.pdf", result.getNomeArquivo());
        assertEquals(pdfContent.length, result.getTamanho());
        verify(repository).save(any(ContratoDocumento.class));
    }

    @Test
    void storeRejectsFakePdf() {
        MockMultipartFile file = new MockMultipartFile("file", "fake.pdf", "application/pdf", "NOT A PDF".getBytes());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> service.store(1L, file));

        assertEquals("Arquivo não é um PDF válido", exception.getMessage());
    }

    @Test
    void storeRejectsOversizedFile() {
        ReflectionTestUtils.setField(service, "maxFileSize", 100L);
        byte[] oversizedContent = new byte[101];
        System.arraycopy("%PDF-".getBytes(), 0, oversizedContent, 0, 5);
        MockMultipartFile file = new MockMultipartFile("file", "large.pdf", "application/pdf", oversizedContent);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> service.store(1L, file));

        assertEquals("Arquivo excede o tamanho máximo permitido", exception.getMessage());
    }

    @Test
    void sanitizeFilenameRemovesDangerousCharacters() {
        assertEquals("contrato.pdf", ContratoDocumentoService.sanitizeFilename(null));
        assertEquals("contrato.pdf", ContratoDocumentoService.sanitizeFilename("   "));
        assertEquals("doc.pdf", ContratoDocumentoService.sanitizeFilename("doc.pdf"));
        assertEquals("malicious.pdf", ContratoDocumentoService.sanitizeFilename("mal\"ic\\ious\r\n.pdf"));
    }
}
