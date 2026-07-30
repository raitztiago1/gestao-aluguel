-- Check if contrato_documento table exists and has data
SELECT table_name FROM information_schema.tables WHERE table_name='contrato_documento';

-- Count documents by contrato
SELECT contrato_id, COUNT(*) as qtd, MAX(uploaded_at) as ultimo_upload 
FROM contrato_documento 
GROUP BY contrato_id;

-- Get latest document for contrato 3
SELECT id, contrato_id, nome_arquivo, tamanho, uploaded_at 
FROM contrato_documento 
WHERE contrato_id = 3 
ORDER BY uploaded_at DESC 
LIMIT 1;
