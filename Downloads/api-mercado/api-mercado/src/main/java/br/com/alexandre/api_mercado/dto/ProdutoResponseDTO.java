package br.com.alexandre.api_mercado.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProdutoResponseDTO(
        Long id,
        String name,
        BigDecimal price,
        Long categoriaId,
        LocalDateTime createdAt,
        LocalDateTime lastUpdate
) {}

