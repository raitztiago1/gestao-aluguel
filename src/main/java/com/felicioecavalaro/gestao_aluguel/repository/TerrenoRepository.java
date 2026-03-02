package com.felicioecavalaro.gestao_aluguel.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.felicioecavalaro.gestao_aluguel.domain.enums.TipoTerreno;
import com.felicioecavalaro.gestao_aluguel.domain.model.Terreno;

@Repository
public interface TerrenoRepository extends JpaRepository<Terreno, Long> {
    List<Terreno> findByTipo(TipoTerreno tipo);
}
