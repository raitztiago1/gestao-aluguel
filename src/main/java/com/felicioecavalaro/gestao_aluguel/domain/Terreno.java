package com.felicioecavalaro.gestao_aluguel.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "terrenos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Terreno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String endereco;

    private BigDecimal area;
}
