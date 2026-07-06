package com.felicioecavalaro.gestao_aluguel.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findBySalaId(Long salaId);

    @Query("""
            SELECT c FROM Contrato c
            JOIN FETCH c.locatario
            JOIN FETCH c.sala
            WHERE c.status IN :statuses
              AND c.dataInicio <= :hoje
              AND c.dataTermino >= :hoje
            """)
    List<Contrato> findActiveContractsWithDetails(
            @Param("statuses") List<StatusContrato> statuses,
            @Param("hoje") LocalDate hoje);
}
