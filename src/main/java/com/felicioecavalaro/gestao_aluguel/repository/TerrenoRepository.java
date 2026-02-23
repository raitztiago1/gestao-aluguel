package com.felicioecavalaro.gestao_aluguel.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;

public interface TerrenoRepository extends JpaRepository<Terreno, Long> {
}
