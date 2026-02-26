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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "locatario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Locatario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", nullable = false)
    private TipoPessoa tipoPessoa;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "cpf_cnpj", nullable = false, unique = true)
    private String cpfCnpj;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "telefone", nullable = false)
    private String telefone;

    @Column(name = "celular")
    private String celular;

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

    // Pessoa Física
    @Column(name = "identidade")
    private String identidade;

    @Column(name = "orgao_expeditor")
    private String orgaoExpeditor;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(name = "estado_civil")
    private String estadoCivil;

    @Column(name = "profissao")
    private String profissao;

    @Column(name = "renda_mensal")
    private BigDecimal rendaMensal;

    // Pessoa Jurídica
    @Column(name = "inscricao_estadual")
    private String inscricaoEstadual;

    @Column(name = "inscricao_municipal")
    private String inscricaoMunicipal;

    @Column(name = "contato_responsavel")
    private String contatoResponsavel;

    @Column(name = "cargo_contato")
    private String cargoContato;

    @Column(name = "documentos", columnDefinition = "jsonb")
    private String documentos;

    @Column(name = "observacoes", columnDefinition = "text")
    private String observacoes;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
}
