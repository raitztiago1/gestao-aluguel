package com.felicioecavalaro.gestao_aluguel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.felicioecavalaro.gestao_aluguel.domain.model.Fiador;

@Repository
public interface FiadorRepository extends JpaRepository<Fiador, Long> {
}
