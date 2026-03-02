package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TerrenoService {
    private final TerrenoRepository repo;

    public List<Terreno> findAll() {
        return repo.findAll();
    }

    /**
     * Método simples para persistir um terreno no banco de dados.
     * Útil para testes de escrita a partir de camadas superiores.
     *
     * @param terreno entidade a ser gravada
     * @return a entidade persistida com o id gerado
     */
    public Terreno create(Terreno terreno) {
        return repo.save(terreno);
    }
}
