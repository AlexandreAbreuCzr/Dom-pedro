package br.com.alexandre.api_mercado.service;

import br.com.alexandre.api_mercado.dto.*;
import br.com.alexandre.api_mercado.exeptions.geral.PreencherCamposException;
import br.com.alexandre.api_mercado.exeptions.geral.ProdutoComEstoqueException;
import br.com.alexandre.api_mercado.exeptions.not_found.CategoriaNotFoundException;
import br.com.alexandre.api_mercado.exeptions.not_found.ProdutoNotFoundException;
import br.com.alexandre.api_mercado.model.Produto;
import br.com.alexandre.api_mercado.repository.CategoriaRepository;
import br.com.alexandre.api_mercado.repository.ProdutoRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Service
public class ProdutoService {
    @Autowired
    ProdutoRepository produtoRepository;

    @Autowired
    CategoriaRepository categoriaRepository;

    @Autowired
    private EstoqueService estoqueService;

    public ProdutoResponseDTO save(ProdutoCreateDTO dto) {
        if (dto.name() == null || dto.price() == null || dto.categoriaId() == null) {
            throw new PreencherCamposException();
        }

        Produto produto = new Produto();
        produto.setName(dto.name());
        produto.setPrice(dto.price());
        produto.setCategoria(
                categoriaRepository.findById(dto.categoriaId())
                        .orElseThrow(CategoriaNotFoundException::new)
        );

        Produto salvo = produtoRepository.save(produto);
        estoqueService.save(new EstoqueCreateDTO(salvo.getId(), 0));
        return mapProduto(salvo);
    }

    public List<ProdutoResponseDTO> getAll() {
        return produtoRepository.findAll().stream()
                .map(this::mapProduto)
                .toList();
    }

    public ProdutoResponseDTO findById(Long id) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(ProdutoNotFoundException::new);
        return mapProduto(produto);
    }

    public List<ProdutoResponseDTO> findByName(String name) {
        return produtoRepository.findByName(name).stream()
                .map(this::mapProduto)
                .toList();
    }

    public List<ProdutoResponseDTO> findByPrice(BigDecimal price) {
        return produtoRepository.findByPrice(price).stream()
                .map(this::mapProduto)
                .toList();
    }


    private ProdutoResponseDTO mapProduto(Produto produto) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getName(),
                produto.getPrice(),
                produto.getCategoria().getId(),
                produto.getCreatedAt(),
                produto.getLastUpdate()
        );
    }

    @Transactional
    public void delete(Long id) {

        Produto produto = produtoRepository.findById(id)
                .orElseThrow(ProdutoNotFoundException::new);

        if (estoqueService.findByProductId(id).quantity() > 0) {
            throw new ProdutoComEstoqueException();
        }
        estoqueService.delete(id);
        produtoRepository.delete(produto);
    }

    public ProdutoResponseDTO update(Long produtoId, ProdutoUpdateDTO dto){
        if (dto.name() == null || dto.price() == null || dto.categoriaId() == null){
            throw new PreencherCamposException();
        }

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(ProdutoNotFoundException::new);

        produto.setName(dto.name());
        produto.setPrice(dto.price());
        produto.setCategoria(categoriaRepository.findById(dto.categoriaId())
                .orElseThrow(CategoriaNotFoundException::new));
        Produto salvo = produtoRepository.save(produto);
        return mapProduto(salvo);

    }

    public ProdutoResponseDTO updatePrice(Long produtoId, ProdutoUpdatePriceDTO dto){
        if (dto.price() == null){
            throw new PreencherCamposException();
        }
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(ProdutoNotFoundException::new);
        produto.setPrice(dto.price());
        Produto salvo = produtoRepository.save(produto);
        return mapProduto(salvo);
    }

    public ProdutoResponseDTO updateName(Long produtoId, ProdutoUpdateNameDTO dto){
        if (dto.name() == null){
            throw new PreencherCamposException();
        }
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(ProdutoNotFoundException::new);
        produto.setName(dto.name());
        Produto salvo = produtoRepository.save(produto);
        return mapProduto(salvo);
    }

    public ProdutoResponseDTO updateCategoria(Long produtoId, ProdutoUpdateCategoriaDTO dto){
        if (dto.categoriaId() == null){
            throw new PreencherCamposException();
        }
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(ProdutoNotFoundException::new);
        produto.setCategoria(categoriaRepository.findById(dto.categoriaId())
                .orElseThrow(CategoriaNotFoundException::new));
        Produto salvo = produtoRepository.save(produto);
        return mapProduto(salvo);
    }

}
