package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.felicioecavalaro.gestao_aluguel.domain.Sala;
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
}
