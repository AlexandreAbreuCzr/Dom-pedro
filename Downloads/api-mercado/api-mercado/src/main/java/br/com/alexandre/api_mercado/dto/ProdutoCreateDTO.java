package br.com.alexandre.api_mercado.dto;

import java.math.BigDecimal;

public record ProdutoCreateDTO(
        String name,
        BigDecimal price
) {
}
