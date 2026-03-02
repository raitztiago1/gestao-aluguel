package com.felicioecavalaro.gestao_aluguel.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusCaucao;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "caucao")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caucao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locatario_id", nullable = false)
    private Locatario locatario;

    @Column(name = "valor", nullable = false)
    private BigDecimal valor;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "descricao", columnDefinition = "text")
    private String descricao;

    @Column(name = "data_deposito", nullable = false)
    private LocalDate dataDeposito;

    @Column(name = "data_previsao_devolucao")
    private LocalDate dataPrevisaoDevolucao;

    @Column(name = "data_devolucao")
    private LocalDate dataDevolucao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusCaucao status;

    @Column(name = "comprovante_url", columnDefinition = "text")
    private String comprovanteUrl;

    @Column(name = "observacoes", columnDefinition = "text")
    private String observacoes;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}