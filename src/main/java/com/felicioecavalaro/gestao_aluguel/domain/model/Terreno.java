package com.felicioecavalaro.gestao_aluguel.domain.model;

import java.math.BigDecimal;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @NotNull(message = "Tipo de terreno é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoTerreno tipo;

    @NotBlank(message = "Endereço é obrigatório")
    @Column(name = "endereco", nullable = false, columnDefinition = "text")
    private String endereco;

    @Column(name = "numero")
    private String numero;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro")
    private String bairro;

    @NotBlank(message = "Cidade é obrigatória")
    @Column(name = "cidade", nullable = false)
    private String cidade;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres")
    @Column(name = "estado", length = 2, nullable = false)
    private String estado;

    @Column(name = "cep")
    private String cep;

    @NotNull(message = "Metragem total é obrigatória")
    @DecimalMin(value = "0.01", inclusive = true, message = "Metragem total deve ser maior que zero")
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
