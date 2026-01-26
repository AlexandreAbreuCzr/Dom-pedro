package br.com.alexandre.api_mercado.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProdutoResponseDTO(
        Long id,
        String name,
        BigDecimal price,
        LocalDate data_created
) {
}
