package com.felicioecavalaro.gestao_aluguel.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.Sala;

public interface SalaRepository extends JpaRepository<Sala, Long> {
}
