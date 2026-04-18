package br.com.alexandre.api_mercado.dto;

import br.com.alexandre.api_mercado.model.Categoria;

import java.math.BigDecimal;

public record ProdutoCreateDTO(
        String name,
        BigDecimal price,
        Long categoriaId
) {
}
