package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalaService {
    private final SalaRepository repo;

    public List<Sala> findAll() {
        return repo.findAll();
    }

    public Sala findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Sala não encontrada: " + id));
    }

    public Sala create(Sala sala) {
        return repo.save(sala);
    }

    public Sala update(Long id, Sala sala) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Sala não encontrada: " + id);
        }
        sala.setId(id);
        return repo.save(sala);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Sala não encontrada: " + id);
        }
        repo.deleteById(id);
    }
}
