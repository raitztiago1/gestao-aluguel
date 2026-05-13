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

import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;
import com.felicioecavalaro.gestao_aluguel.service.TerrenoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/terrenos")
@RequiredArgsConstructor
public class TerrenoController {
    private final TerrenoService service;

    @GetMapping
    public List<Terreno> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Terreno get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Terreno create(@RequestBody Terreno terreno) {
        return service.create(terreno);
    }

    @PutMapping("/{id}")
    public Terreno update(@PathVariable Long id, @RequestBody Terreno terreno) {
        return service.update(id, terreno);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
