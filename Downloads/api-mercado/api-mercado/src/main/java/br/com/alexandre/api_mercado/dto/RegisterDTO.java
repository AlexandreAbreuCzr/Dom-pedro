package br.com.alexandre.api_mercado.dto;

import br.com.alexandre.api_mercado.model.UserRole;

public record RegisterDTO(
        String name,
        String passworld,
        UserRole role
) {}
