package com.felicioecavalaro.gestao_aluguel.service;

import com.felicioecavalaro.gestao_aluguel.domain.Sala;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalaService {
    private final SalaRepository repo;

    public List<Sala> findAll() {
        return repo.findAll();
    }
}
