package com.felicioecavalaro.gestao_aluguel.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

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
@Table(name = "fiador")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fiador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locatario_id", nullable = false)
    private Locatario locatario;

    @Column(name = "nome", nullable = false, length = 200)
    private String nome;

    @Column(name = "cpf", nullable = false, unique = true, length = 14)
    private String cpf;

    @Column(name = "identidade", nullable = false, length = 20)
    private String identidade;

    @Column(name = "orgao_expeditor", length = 10)
    private String orgaoExpeditor;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    @Column(name = "nacionalidade", length = 50)
    private String nacionalidade;

    @Column(name = "estado_civil", length = 20)
    private String estadoCivil;

    @Column(name = "profissao", length = 100)
    private String profissao;

    @Column(name = "renda_mensal", nullable = false)
    private BigDecimal rendaMensal;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "telefone", nullable = false, length = 20)
    private String telefone;

    @Column(name = "endereco", nullable = false, columnDefinition = "text")
    private String endereco;

    @Column(name = "numero", length = 10)
    private String numero;

    @Column(name = "complemento", length = 100)
    private String complemento;

    @Column(name = "bairro", length = 100)
    private String bairro;

    @Column(name = "cidade", nullable = false, length = 100)
    private String cidade;

    @Column(name = "estado", nullable = false, length = 2)
    private String estado;

    @Column(name = "cep", length = 10)
    private String cep;

    @Column(name = "documentos", columnDefinition = "jsonb")
    private String documentos;

    @Column(name = "observacoes", columnDefinition = "text")
    private String observacoes;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}