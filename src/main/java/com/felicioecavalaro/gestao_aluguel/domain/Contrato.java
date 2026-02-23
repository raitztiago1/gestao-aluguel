package com.felicioecavalaro.gestao_aluguel.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
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
@Table(name = "contratos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contrato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate inicio;

    private LocalDate termino;

    private BigDecimal valor;

    @ManyToOne
    @JoinColumn(name = "locatario_id")
    private Locatario locatario;

    // recursoTipo: "SALA" ou "TERRENO"; recursoId referencia a Sala.id ou
    // Terreno.id
    private String recursoTipo;

    private Long recursoId;
}
