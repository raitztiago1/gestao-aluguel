package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public String test() {
        return "Sistema de Gestão de Alugueis rodando com Spring Boot!";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/check-docs")
    public Object checkDocs() {
        try {
            List<Map<String, Object>> docs = jdbcTemplate.queryForList(
                    "SELECT id, contrato_id, nome_arquivo, tamanho, uploaded_at FROM contrato_documento ORDER BY id DESC LIMIT 5");
            return docs;
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    @PostMapping("/create-test-data")
    public String createTestData() {
        try {
            // Insert locatario with NULL for JSONB field
            jdbcTemplate.update(
                    "INSERT INTO locatario (nome, cpf_cnpj, tipo_pessoa, email, telefone, endereco, numero, bairro, cidade, estado, cep, documentos, created_at, updated_at) "
                            +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL::jsonb, NOW(), NOW()) " +
                            "ON CONFLICT (cpf_cnpj) DO NOTHING",
                    "LocTest", "12345678000190", "JURIDICA", "loctest@test.com", "1199999999",
                    "Rua Test", "100", "Centro", "Sao Paulo", "SP", "01000000");

            // Insert contrato using subquery
            jdbcTemplate.update(
                    "INSERT INTO contrato (sala_id, locatario_id, data_inicio, data_termino, valor_aluguel, dia_vencimento, status, created_at, updated_at) "
                            +
                            "SELECT ? as sala_id, l.id as locatario_id, ?::date, ?::date, ?, ?, ?, NOW(), NOW() " +
                            "FROM locatario l WHERE l.cpf_cnpj = ? LIMIT 1",
                    4, "2026-06-01", "2027-06-01", 1500.0, 10, "ATIVO", "12345678000190");

            return "Test data created successfully";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

}
