package com.felicioecavalaro.gestao_aluguel.repository;

import com.felicioecavalaro.gestao_aluguel.domain.Terreno;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TerrenoRepository extends JpaRepository<Terreno, Long> {
}
