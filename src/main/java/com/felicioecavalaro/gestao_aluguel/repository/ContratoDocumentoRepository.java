package com.felicioecavalaro.gestao_aluguel.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.felicioecavalaro.gestao_aluguel.domain.model.ContratoDocumento;

public interface ContratoDocumentoRepository extends JpaRepository<ContratoDocumento, Long> {
    @Query(value = "SELECT * FROM contrato_documento WHERE contrato_id = :contratoId ORDER BY uploaded_at DESC LIMIT 1", nativeQuery = true)
    Optional<ContratoDocumento> findTopByContratoIdOrderByUploadedAtDesc(@Param("contratoId") Long contratoId);

    void deleteByContratoId(Long contratoId);
}
