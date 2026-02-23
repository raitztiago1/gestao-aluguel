package com.felicioecavalaro.gestao_aluguel.controller;

import com.felicioecavalaro.gestao_aluguel.domain.Locatario;
import com.felicioecavalaro.gestao_aluguel.service.LocatarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
