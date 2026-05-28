package com.felicioecavalaro.gestao_aluguel.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "contrato_documento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoDocumento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id")
    private com.felicioecavalaro.gestao_aluguel.domain.model.Contrato contrato;

    @Column(name = "nome_arquivo")
    private String nomeArquivo;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "conteudo")
    private byte[] conteudo;

    @Column(name = "tamanho")
    private Integer tamanho;

    @Column(name = "uploaded_at")
    private java.time.LocalDateTime uploadedAt;
}
