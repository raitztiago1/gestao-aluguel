package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.felicioecavalaro.gestao_aluguel.domain.Locatario;
import com.felicioecavalaro.gestao_aluguel.service.LocatarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/locatarios")
@RequiredArgsConstructor
public class LocatarioController {
    private final LocatarioService service;

    @GetMapping
    public List<Locatario> list() {
        return service.findAll();
    }
}
