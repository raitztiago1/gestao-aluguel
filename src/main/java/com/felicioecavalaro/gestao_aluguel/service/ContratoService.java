package com.felicioecavalaro.gestao_aluguel.service;

import com.felicioecavalaro.gestao_aluguel.domain.Contrato;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContratoService {
    private final ContratoRepository repo;

    public List<Contrato> findAll() {
        return repo.findAll();
    }
}
