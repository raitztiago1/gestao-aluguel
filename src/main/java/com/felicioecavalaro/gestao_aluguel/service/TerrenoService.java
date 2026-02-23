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
}
