package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContratoService {
    private final ContratoRepository repo;

    public List<Contrato> findAll() {
        return repo.findAll();
    }

    public Contrato findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Contrato não encontrado: " + id));
    }

    public Contrato create(Contrato contrato) {
        return repo.save(contrato);
    }

    public Contrato update(Long id, Contrato contrato) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Contrato não encontrado: " + id);
        }
        contrato.setId(id);
        return repo.save(contrato);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Contrato não encontrado: " + id);
        }
        repo.deleteById(id);
    }
}
