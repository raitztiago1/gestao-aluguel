package com.felicioecavalaro.gestao_aluguel.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "locatarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Locatario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String cpf;

    private String telefone;
}
