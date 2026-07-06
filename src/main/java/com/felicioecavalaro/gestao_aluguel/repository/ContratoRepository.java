package com.felicioecavalaro.gestao_aluguel.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findBySalaId(Long salaId);
}
