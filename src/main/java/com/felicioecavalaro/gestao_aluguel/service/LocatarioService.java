package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.Locatario;
import com.felicioecavalaro.gestao_aluguel.repository.LocatarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocatarioService {
    private final LocatarioRepository repo;

    public List<Locatario> findAll() {
        return repo.findAll();
    }
}
