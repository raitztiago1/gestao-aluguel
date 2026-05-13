package com.felicioecavalaro.gestao_aluguel.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import jakarta.persistence.EntityNotFoundException;
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
        validateTerreno(terreno);
        return repo.save(terreno);
    }

    public Terreno update(Long id, Terreno terreno) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Terreno não encontrado: " + id);
        }
        terreno.setId(id);
        validateTerreno(terreno);
        return repo.save(terreno);
    }

    private void validateTerreno(Terreno terreno) {
        if (terreno.getTipo() == null) {
            throw new IllegalArgumentException("Tipo de terreno é obrigatório");
        }
        if (terreno.getEndereco() == null || terreno.getEndereco().isBlank()) {
            throw new IllegalArgumentException("Endereço é obrigatório");
        }
        if (terreno.getCidade() == null || terreno.getCidade().isBlank()) {
            throw new IllegalArgumentException("Cidade é obrigatória");
        }
        if (terreno.getEstado() == null || terreno.getEstado().isBlank()) {
            throw new IllegalArgumentException("Estado é obrigatório");
        }
        if (terreno.getEstado().length() != 2) {
            throw new IllegalArgumentException("Estado deve ter 2 caracteres");
        }
        if (terreno.getMetragemTotal() == null) {
            throw new IllegalArgumentException("Metragem total é obrigatória");
        }
        if (terreno.getMetragemTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Metragem total deve ser maior que zero");
        }

        if (terreno.getTipo() == TipoTerreno.COMERCIAL) {
            if (terreno.getVagasGaragem() == null) {
                throw new IllegalArgumentException("Vagas de garagem são obrigatórias para terreno comercial");
            }
            if (terreno.getQuantidadeSalas() == null) {
                throw new IllegalArgumentException("Quantidade de salas é obrigatória para terreno comercial");
            }
            if (terreno.getMetragemSalas() == null) {
                throw new IllegalArgumentException("Metragem de salas é obrigatória para terreno comercial");
            }
            if (terreno.getMetragemCasa() != null) {
                throw new IllegalArgumentException("Metragem de casa não deve ser informada para terreno comercial");
            }
        } else if (terreno.getTipo() == TipoTerreno.RESIDENCIAL) {
            if (terreno.getMetragemCasa() == null) {
                throw new IllegalArgumentException("Metragem de casa é obrigatória para terreno residencial");
            }
            if (terreno.getVagasGaragem() != null || terreno.getQuantidadeSalas() != null
                    || terreno.getMetragemSalas() != null) {
                throw new IllegalArgumentException(
                        "Campos de comercial não devem ser informados para terreno residencial");
            }
        }
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Terreno não encontrado: " + id);
        }
        repo.deleteById(id);
    }
}
