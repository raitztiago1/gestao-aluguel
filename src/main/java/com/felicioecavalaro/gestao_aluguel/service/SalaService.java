package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusSala;
import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalaService {
    private final SalaRepository repo;
    private final ContratoRepository contratoRepository;
    private final TerrenoRepository terrenoRepository;

    public List<Sala> findAll() {
        List<Sala> salas = repo.findAll();
        salas.forEach(this::syncStatus);
        return salas;
    }

    public Sala findById(Long id) {
        Sala sala = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Sala não encontrada: " + id));
        syncStatus(sala);
        return sala;
    }

    public Sala create(Sala sala) {
        validarRestricaoTerrenoResidencial(sala.getTerreno(), null);
        Sala saved = repo.save(sala);
        syncStatus(saved);
        return saved;
    }

    public Sala update(Long id, Sala sala) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Sala não encontrada: " + id);
        }
        validarRestricaoTerrenoResidencial(sala.getTerreno(), id);
        sala.setId(id);
        Sala saved = repo.save(sala);
        syncStatus(saved);
        return saved;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Sala não encontrada: " + id);
        }
        repo.deleteById(id);
    }

    private void validarRestricaoTerrenoResidencial(Terreno terreno, Long currentSalaId) {
        if (terreno == null || terreno.getId() == null) {
            return;
        }

        Terreno terrenoPersistido = terrenoRepository.findById(terreno.getId()).orElse(null);
        if (terrenoPersistido == null || terrenoPersistido.getTipo() != TipoTerreno.RESIDENCIAL) {
            return;
        }

        boolean alreadyHasSala = repo.findAll().stream()
                .filter(existingSala -> existingSala.getId() == null || !existingSala.getId().equals(currentSalaId))
                .anyMatch(existingSala -> existingSala.getTerreno() != null
                        && existingSala.getTerreno().getId() != null
                        && existingSala.getTerreno().getId().equals(terreno.getId()));

        if (alreadyHasSala) {
            throw new IllegalArgumentException("Terreno residencial já possui uma sala cadastrada");
        }
    }

    private void syncStatus(Sala sala) {
        if (sala == null || sala.getId() == null || sala.getStatus() == StatusSala.MANUTENCAO) {
            return;
        }
        boolean occupied = contratoRepository.findBySalaId(sala.getId()).stream()
                .filter(contrato -> contrato.getDataInicio() != null && contrato.getDataTermino() != null)
                .filter(contrato -> contrato.getStatus() == StatusContrato.ATIVO || contrato.getStatus() == StatusContrato.RENOVADO)
                .anyMatch(contrato -> !java.time.LocalDate.now().isBefore(contrato.getDataInicio())
                        && !java.time.LocalDate.now().isAfter(contrato.getDataTermino()));
        sala.setStatus(occupied ? StatusSala.LOCADA : StatusSala.DISPONIVEL);
        repo.save(sala);
    }
}
