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

import com.felicioecavalaro.gestao_aluguel.domain.model.Sala;
import com.felicioecavalaro.gestao_aluguel.service.SalaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
public class SalaController {
    private final SalaService service;

    @GetMapping
    public List<Sala> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Sala get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sala create(@RequestBody Sala sala) {
        return service.create(sala);
    }

    @PutMapping("/{id}")
    public Sala update(@PathVariable Long id, @RequestBody Sala sala) {
        return service.update(id, sala);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
