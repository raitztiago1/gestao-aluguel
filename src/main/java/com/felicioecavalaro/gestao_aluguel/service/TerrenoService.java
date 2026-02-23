package com.felicioecavalaro.gestao_aluguel.service;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TerrenoService {
    private final TerrenoRepository repo;

    public List<Terreno> findAll() {
        return repo.findAll();
    }
}
