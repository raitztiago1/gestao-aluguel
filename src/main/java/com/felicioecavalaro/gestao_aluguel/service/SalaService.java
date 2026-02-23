package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.Sala;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalaService {
    private final SalaRepository repo;

    public List<Sala> findAll() {
        return repo.findAll();
    }
}
