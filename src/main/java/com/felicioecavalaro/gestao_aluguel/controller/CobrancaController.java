package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;
import com.felicioecavalaro.gestao_aluguel.service.CobrancaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cobrancas")
@RequiredArgsConstructor
public class CobrancaController {
    private final CobrancaService service;

    @GetMapping
    public List<Cobranca> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Cobranca get(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/contrato/{contratoId}")
    public List<Cobranca> listByContrato(@PathVariable Long contratoId) {
        return service.findByContratoId(contratoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cobranca create(@RequestBody Cobranca cobranca) {
        return service.create(cobranca);
    }

    @PostMapping("/contrato/{contratoId}/mes/{ano}/{mes}")
    @ResponseStatus(HttpStatus.CREATED)
    public Cobranca registerMonthlyStatus(
            @PathVariable Long contratoId,
            @PathVariable Integer ano,
            @PathVariable Integer mes,
            @RequestBody Cobranca cobranca) {
        return service.registerMonthlyStatus(contratoId, ano, mes, cobranca);
    }

    @PutMapping("/{id}")
    public Cobranca update(@PathVariable Long id, @RequestBody Cobranca cobranca) {
        return service.update(id, cobranca);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
