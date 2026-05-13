package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;
import com.felicioecavalaro.gestao_aluguel.repository.LocatarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocatarioService {
    private final LocatarioRepository repo;

    public List<Locatario> findAll() {
        return repo.findAll();
    }

    public Locatario findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Locatário não encontrado: " + id));
    }

    public Locatario create(Locatario locatario) {
        return repo.save(locatario);
    }

    public Locatario update(Long id, Locatario locatario) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Locatário não encontrado: " + id);
        }
        locatario.setId(id);
        return repo.save(locatario);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Locatário não encontrado: " + id);
        }
        repo.deleteById(id);
    }
}
