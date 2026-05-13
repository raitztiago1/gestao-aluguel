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

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.service.ContratoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contratos")
@RequiredArgsConstructor
public class ContratoController {
    private final ContratoService service;

    @GetMapping
    public List<Contrato> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Contrato get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contrato create(@RequestBody Contrato contrato) {
        return service.create(contrato);
    }

    @PutMapping("/{id}")
    public Contrato update(@PathVariable Long id, @RequestBody Contrato contrato) {
        return service.update(id, contrato);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
