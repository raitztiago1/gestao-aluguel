package com.felicioecavalaro.gestao_aluguel.repository;

import com.felicioecavalaro.gestao_aluguel.domain.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
}
