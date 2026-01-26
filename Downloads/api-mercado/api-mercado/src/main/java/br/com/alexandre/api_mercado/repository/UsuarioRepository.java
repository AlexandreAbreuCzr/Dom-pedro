package br.com.alexandre.api_mercado.repository;


import br.com.alexandre.api_mercado.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    UserDetails findByName(String name);
}
