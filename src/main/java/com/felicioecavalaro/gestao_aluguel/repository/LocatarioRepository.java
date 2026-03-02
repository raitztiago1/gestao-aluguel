package com.felicioecavalaro.gestao_aluguel.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.felicioecavalaro.gestao_aluguel.domain.model.Locatario;

public interface LocatarioRepository extends JpaRepository<Locatario, Long> {
}
