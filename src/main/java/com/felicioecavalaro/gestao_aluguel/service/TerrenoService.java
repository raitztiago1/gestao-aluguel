package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TerrenoService {
    private final TerrenoRepository repo;

    public List<Terreno> findAll() {
        return repo.findAll();
    }

    public Terreno findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Terreno não encontrado: " + id));
    }

    public Terreno create(Terreno terreno) {
        return repo.save(terreno);
    }

    public Terreno update(Long id, Terreno terreno) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Terreno não encontrado: " + id);
        }
        terreno.setId(id);
        return repo.save(terreno);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Terreno não encontrado: " + id);
        }
        repo.deleteById(id);
    }
}
