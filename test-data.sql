INSERT INTO locatario (nome, cpf_cnpj, tipo_pessoa, email, telefone, endereco, numero, bairro, cidade, estado, cep, ativo, created_at, updated_at) 
VALUES ('Locatario Test', '12345678000190', 'JURIDICA', 'loc@test.com', '1199999', 'Rua Test', '200', 'Centro', 'SP', 'SP', '01000', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO contrato (sala_id, locatario_id, data_inicio, data_termino, valor_aluguel, dia_vencimento, status, created_at, updated_at)
VALUES (4, 1, '2026-06-01'::date, '2027-06-01'::date, 1500, 10, 'ATIVO', NOW(), NOW())
ON CONFLICT DO NOTHING;
