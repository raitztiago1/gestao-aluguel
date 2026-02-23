package com.felicioecavalaro.gestao_aluguel.repository;

import com.felicioecavalaro.gestao_aluguel.domain.Locatario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocatarioRepository extends JpaRepository<Locatario, Long> {
}
