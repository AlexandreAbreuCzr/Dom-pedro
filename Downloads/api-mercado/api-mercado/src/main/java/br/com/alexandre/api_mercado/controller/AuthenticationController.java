package br.com.alexandre.api_mercado.controller;

import br.com.alexandre.api_mercado.dto.AuthenticationDTO;
import br.com.alexandre.api_mercado.dto.RegisterDTO;
import br.com.alexandre.api_mercado.dto.UsuarioResponseDTO;
import br.com.alexandre.api_mercado.infra.security.TokenService;
import br.com.alexandre.api_mercado.model.Usuario;
import br.com.alexandre.api_mercado.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthenticationDTO data){
        var usernamePassworld = new UsernamePasswordAuthenticationToken(data.name(), data.passworld());
        var auth = this.authenticationManager.authenticate(usernamePassworld);

        var token = tokenService.generateToken((Usuario) auth.getPrincipal());

        return ResponseEntity.ok(new UsuarioResponseDTO(token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterDTO data){
        if(this.usuarioRepository.findByName(data.name()) != null) return ResponseEntity.badRequest().build();

        String encryptedPassword = new BCryptPasswordEncoder().encode(data.passworld());
        Usuario newUsuario = new Usuario(data.name(), encryptedPassword, data.role());

        this.usuarioRepository.save(newUsuario);

        return ResponseEntity.ok().build();

    }
}
