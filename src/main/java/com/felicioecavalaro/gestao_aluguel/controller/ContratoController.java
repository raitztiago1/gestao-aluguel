package com.felicioecavalaro.gestao_aluguel.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.felicioecavalaro.gestao_aluguel.domain.Contrato;
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
}
