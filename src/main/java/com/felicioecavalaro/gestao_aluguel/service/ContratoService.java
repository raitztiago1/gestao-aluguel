package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.Contrato;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContratoService {
    private final ContratoRepository repo;

    public List<Contrato> findAll() {
        return repo.findAll();
    }
}
