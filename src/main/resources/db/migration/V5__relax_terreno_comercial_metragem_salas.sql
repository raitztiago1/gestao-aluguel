ALTER TABLE terreno
    ALTER COLUMN metragem_salas DROP NOT NULL;

ALTER TABLE terreno
    DROP CONSTRAINT IF EXISTS valida_terreno_comercial;

ALTER TABLE terreno
    ADD CONSTRAINT valida_terreno_comercial CHECK (
        (
            tipo = 'COMERCIAL'
            AND vagas_garagem IS NOT NULL
            AND quantidade_salas IS NOT NULL
            AND metragem_casa IS NULL
        )
        OR
        (
            tipo = 'RESIDENCIAL'
            AND metragem_casa IS NOT NULL
            AND vagas_garagem IS NULL
            AND quantidade_salas IS NULL
            AND metragem_salas IS NULL
        )
    );
