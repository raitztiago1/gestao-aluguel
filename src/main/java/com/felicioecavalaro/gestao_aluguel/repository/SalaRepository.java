package com.felicioecavalaro.gestao_aluguel.repository;

import com.felicioecavalaro.gestao_aluguel.domain.Sala;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalaRepository extends JpaRepository<Sala, Long> {
}
