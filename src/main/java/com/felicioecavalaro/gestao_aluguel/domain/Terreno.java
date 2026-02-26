package com.felicioecavalaro.gestao_aluguel.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "terreno")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Terreno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoTerreno tipo;

    @Column(name = "endereco", nullable = false, columnDefinition = "text")
    private String endereco;

    @Column(name = "numero")
    private String numero;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade", nullable = false)
    private String cidade;

    @Column(name = "estado", length = 2, nullable = false)
    private String estado;

    @Column(name = "cep")
    private String cep;

    @Column(name = "metragem_total", nullable = false)
    private BigDecimal metragemTotal;

    @Column(name = "vagas_garagem")
    private Integer vagasGaragem;

    @Column(name = "quantidade_salas")
    private Integer quantidadeSalas;

    @Column(name = "metragem_salas")
    private BigDecimal metragemSalas;

    @Column(name = "metragem_casa")
    private BigDecimal metragemCasa;

    @Column(name = "observacoes", columnDefinition = "text")
    private String observacoes;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}
