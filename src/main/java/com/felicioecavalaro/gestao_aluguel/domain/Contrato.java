package com.felicioecavalaro.gestao_aluguel.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

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

    // recursoTipo: "SALA" ou "TERRENO"; recursoId referencia a Sala.id ou Terreno.id
    private String recursoTipo;

    private Long recursoId;
}
