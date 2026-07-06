package com.felicioecavalaro.gestao_aluguel.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusSala;
import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.repository.ContratoRepository;
import com.felicioecavalaro.gestao_aluguel.repository.SalaRepository;
import com.felicioecavalaro.gestao_aluguel.repository.TerrenoRepository;

import jakarta.persistence.EntityNotFoundException;
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
        validarRegrasTerreno(sala, null);
        Sala saved = repo.save(sala);
        syncStatus(saved);
        return saved;
    }

    public Sala update(Long id, Sala sala) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Sala não encontrada: " + id);
        }
        validarRegrasTerreno(sala, id);
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

    private void validarRegrasTerreno(Sala sala, Long currentSalaId) {
        Terreno terreno = sala.getTerreno();
        if (terreno == null || terreno.getId() == null) {
            return;
        }

        Terreno terrenoPersistido = terrenoRepository.findById(terreno.getId()).orElse(null);
        if (terrenoPersistido == null) {
            return;
        }

        List<Sala> outrasSalasDoTerreno = repo.findAll().stream()
                .filter(existingSala -> existingSala.getId() == null || !existingSala.getId().equals(currentSalaId))
                .filter(existingSala -> existingSala.getTerreno() != null
                        && existingSala.getTerreno().getId() != null
                        && existingSala.getTerreno().getId().equals(terreno.getId()))
                .toList();

        String identificacao = sala.getIdentificacao() == null ? "" : sala.getIdentificacao().trim();
        boolean identificacaoDuplicada = outrasSalasDoTerreno.stream()
                .anyMatch(existingSala -> existingSala.getIdentificacao() != null
                        && existingSala.getIdentificacao().trim().equalsIgnoreCase(identificacao));

        if (!identificacao.isBlank() && identificacaoDuplicada) {
            throw new IllegalArgumentException("Já existe uma sala com esta identificação neste terreno");
        }

        if (terrenoPersistido.getTipo() == TipoTerreno.RESIDENCIAL && !outrasSalasDoTerreno.isEmpty()) {
            throw new IllegalArgumentException("Terreno residencial já possui uma sala cadastrada");
        }

        if (terrenoPersistido.getTipo() == TipoTerreno.COMERCIAL
                && terrenoPersistido.getQuantidadeSalas() != null
                && outrasSalasDoTerreno.size() >= terrenoPersistido.getQuantidadeSalas()) {
            throw new IllegalArgumentException("Quantidade máxima de salas para este terreno já foi atingida");
        }
    }

    private void syncStatus(Sala sala) {
        if (sala == null || sala.getId() == null || sala.getStatus() == StatusSala.MANUTENCAO) {
            return;
        }
        boolean occupied = contratoRepository.findBySalaId(sala.getId()).stream()
                .filter(contrato -> contrato.getDataInicio() != null && contrato.getDataTermino() != null)
                .filter(contrato -> contrato.getStatus() == StatusContrato.ATIVO
                        || contrato.getStatus() == StatusContrato.RENOVADO)
                .anyMatch(contrato -> !java.time.LocalDate.now().isBefore(contrato.getDataInicio())
                        && !java.time.LocalDate.now().isAfter(contrato.getDataTermino()));
        sala.setStatus(occupied ? StatusSala.LOCADA : StatusSala.DISPONIVEL);
        repo.save(sala);
    }
}
