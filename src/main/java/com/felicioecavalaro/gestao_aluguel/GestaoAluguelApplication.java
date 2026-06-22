package com.felicioecavalaro.gestao_aluguel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestaoAluguelApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestaoAluguelApplication.class, args);
	}

}
