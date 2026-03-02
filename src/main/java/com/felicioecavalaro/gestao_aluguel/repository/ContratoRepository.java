package com.felicioecavalaro.gestao_aluguel.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
}
