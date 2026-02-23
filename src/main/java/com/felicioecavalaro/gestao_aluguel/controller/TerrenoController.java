package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
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
}
