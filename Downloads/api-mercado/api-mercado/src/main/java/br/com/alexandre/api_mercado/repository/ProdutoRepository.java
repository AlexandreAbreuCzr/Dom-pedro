package br.com.alexandre.api_mercado.repository;

import br.com.alexandre.api_mercado.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    List<Produto> findByName(String name);
    List<Produto> findByPrice(BigDecimal price);
}
