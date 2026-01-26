package br.com.alexandre.api_mercado.service;

import br.com.alexandre.api_mercado.dto.ProdutoCreateDTO;
import br.com.alexandre.api_mercado.dto.ProdutoResponseDTO;
import br.com.alexandre.api_mercado.model.Produto;
import br.com.alexandre.api_mercado.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProdutoService {
    @Autowired
    ProdutoRepository produtoRepository;

    public ProdutoResponseDTO save(ProdutoCreateDTO dto){
        if(dto.name() == null || dto.price() == null){
            throw new IllegalArgumentException("Preencher Todos os campos");
        }
        Produto produto = new Produto();
        produto.setName(dto.name());
        produto.setPrice(dto.price());

        Produto salvo = produtoRepository.save(produto);
        return new ProdutoResponseDTO(
                salvo.getId(),
                salvo.getName(),
                salvo.getPrice(),
                salvo.getData_created()
        );
    }

    public List<ProdutoResponseDTO> getAll(){
        List<Produto> produtos = produtoRepository.findAll();
        List<ProdutoResponseDTO> resposta = new ArrayList<>();

        for (Produto produto: produtos){
            resposta.add(new ProdutoResponseDTO(
                    produto.getId(),
                    produto.getName(),
                    produto.getPrice(),
                    produto.getData_created()
            ));
        }
        return resposta;
    }

    public ProdutoResponseDTO findById(Long id) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getName(),
                produto.getPrice(),
                produto.getData_created()
        );
    }

    public List<ProdutoResponseDTO> findByName(String name){
        List<Produto> produtos = produtoRepository.findByName(name);
        List<ProdutoResponseDTO> resposta = new ArrayList<>();

        for (Produto produto: produtos){
            resposta.add(new ProdutoResponseDTO(
                    produto.getId(),
                    produto.getName(),
                    produto.getPrice(),
                    produto.getData_created()
            ));
        }
        return resposta;
    }

    public List<ProdutoResponseDTO> findByPrice(BigDecimal price){
        List<Produto> produtos = produtoRepository.findByPrice(price);
        List<ProdutoResponseDTO> resposta = new ArrayList<>();

        for (Produto produto: produtos){
            resposta.add(new ProdutoResponseDTO(
                    produto.getId(),
                    produto.getName(),
                    produto.getPrice(),
                    produto.getData_created()
            ));
        }
        return resposta;
    }
}
