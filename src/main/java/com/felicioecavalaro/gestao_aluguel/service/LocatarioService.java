package com.felicioecavalaro.gestao_aluguel.service;

import com.felicioecavalaro.gestao_aluguel.domain.Locatario;
import com.felicioecavalaro.gestao_aluguel.repository.LocatarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocatarioService {
    private final LocatarioRepository repo;

    public List<Locatario> findAll() {
        return repo.findAll();
    }
}
