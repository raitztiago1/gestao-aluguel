package com.felicioecavalaro.gestao_aluguel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.model.Cobranca;

public interface CobrancaRepository extends JpaRepository<Cobranca, Long> {
    List<Cobranca> findAllByContratoIdOrderByAnoDescMesDesc(Long contratoId);

    Optional<Cobranca> findByContratoIdAndAnoAndMes(Long contratoId, Integer ano, Integer mes);
}
