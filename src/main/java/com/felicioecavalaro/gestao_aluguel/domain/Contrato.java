package com.felicioecavalaro.gestao_aluguel.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "contrato")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contrato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne
    @JoinColumn(name = "locatario_id", nullable = false)
    private Locatario locatario;

    @Column(name = "fiador_id")
    private Long fiadorId;

    @Column(name = "caucao_id")
    private Long caucaoId;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_termino", nullable = false)
    private LocalDate dataTermino;

    @Column(name = "data_renovacao")
    private LocalDate dataRenovacao;

    @Column(name = "valor_aluguel", nullable = false)
    private BigDecimal valorAluguel;

    @Column(name = "valor_condominio")
    private BigDecimal valorCondominio;

    @Column(name = "valor_iptu")
    private BigDecimal valorIptu;

    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    @Column(name = "regras_pagamento", columnDefinition = "text")
    private String regrasPagamento;

    @Column(name = "observacoes", columnDefinition = "text")
    private String observacoes;

    @Column(name = "documento_url")
    private String documentoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusContrato status;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;
}
