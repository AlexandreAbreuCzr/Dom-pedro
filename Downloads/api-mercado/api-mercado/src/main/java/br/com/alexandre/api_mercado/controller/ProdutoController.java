package br.com.alexandre.api_mercado.controller;

import br.com.alexandre.api_mercado.dto.*;
import br.com.alexandre.api_mercado.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    @PostMapping
    public ResponseEntity<ProdutoResponseDTO> create(
            @RequestBody @Valid ProdutoCreateDTO dto) {

        return ResponseEntity.status(201).body(produtoService.save(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProdutoResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<ProdutoResponseDTO>> getAll() {
        return ResponseEntity.ok(produtoService.getAll());
    }

    @GetMapping("/nome/{name}")
    public ResponseEntity<List<ProdutoResponseDTO>> getByName(@PathVariable String name) {
        return ResponseEntity.ok(produtoService.findByName(name));
    }

    @GetMapping("/preco/{price}")
    public ResponseEntity<List<ProdutoResponseDTO>> getByPrice(@PathVariable BigDecimal price) {
        return ResponseEntity.ok(produtoService.findByPrice(price));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        produtoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponseDTO> update(
            @PathVariable Long id,
            @RequestBody @Valid ProdutoUpdateDTO dto) {

        return ResponseEntity.ok(produtoService.update(id, dto));
    }


    @PatchMapping("/{id}/price")
    public ResponseEntity<ProdutoResponseDTO> updatePrice(
            @PathVariable Long id,
            @RequestBody @Valid ProdutoUpdatePriceDTO dto) {

        return ResponseEntity.ok(produtoService.updatePrice(id, dto));
    }

    @PatchMapping("/{id}/name")
    public ResponseEntity<ProdutoResponseDTO> updateName(
            @PathVariable Long id,
            @RequestBody @Valid ProdutoUpdateNameDTO dto) {

        return ResponseEntity.ok(produtoService.updateName(id, dto));
    }

    @PatchMapping("/{id}/categoria")
    public ResponseEntity<ProdutoResponseDTO> updateCategoria(
            @PathVariable Long id,
            @RequestBody @Valid ProdutoUpdateCategoriaDTO dto) {

        return ResponseEntity.ok(produtoService.updateCategoria(id, dto));
    }

}

