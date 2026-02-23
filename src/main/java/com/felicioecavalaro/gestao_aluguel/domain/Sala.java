package com.felicioecavalaro.gestao_aluguel.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "salas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;

    private Integer andar;

    private BigDecimal area;
}
