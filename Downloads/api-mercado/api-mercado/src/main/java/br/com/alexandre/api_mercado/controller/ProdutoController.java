package br.com.alexandre.api_mercado.controller;

import br.com.alexandre.api_mercado.dto.ProdutoCreateDTO;
import br.com.alexandre.api_mercado.dto.ProdutoResponseDTO;
import br.com.alexandre.api_mercado.repository.ProdutoRepository;
import br.com.alexandre.api_mercado.service.ProdutoService;
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


    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody ProdutoCreateDTO params){
        try {
            var result = produtoService.save(params);
            return ResponseEntity.ok(result);
        }catch (IllegalArgumentException e){
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id){
        try {
            var result = produtoService.findById(id);
            return ResponseEntity.ok(result);
        }catch (RuntimeException e){
            return ResponseEntity.status(400).body(e.getMessage());
        }

    }

    @GetMapping("/get")
    public List<ProdutoResponseDTO> get(@RequestParam(required = false) String name, @RequestParam(required = false) BigDecimal price){
        if(name != null && price != null){
            throw new IllegalArgumentException("Use apenas um filtro por vez");
        }

        if (name !=null){
            return produtoService.findByName(name);
        }

        if (price != null){
            return produtoService.findByPrice(price);
        }

        return produtoService.getAll();
    }

}
