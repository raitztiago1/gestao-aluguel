package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.dto.ForgotPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginResponse;
import com.felicioecavalaro.gestao_aluguel.dto.RegisterRequest;
import com.felicioecavalaro.gestao_aluguel.dto.ResetPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!usuario.getAtivo()) {
            throw new RuntimeException("Usuário inativo");
        }

        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            throw new RuntimeException("Senha incorreta");
        }

        String token = jwtService.generateToken(usuario);

        return LoginResponse.builder()
                .token(token)
                .usuarioId(usuario.getId())
                .nomeCompleto(usuario.getNomeCompleto())
                .email(usuario.getEmail())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }

        String senhaEncriptada = passwordEncoder.encode(request.getSenha());

        Usuario novoUsuario = Usuario.builder()
                .email(request.getEmail())
                .senha(senhaEncriptada)
                .nomeCompleto(request.getNomeCompleto())
                .ativo(true)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);

        String token = jwtService.generateToken(usuarioSalvo);

        return LoginResponse.builder()
                .token(token)
                .usuarioId(usuarioSalvo.getId())
                .nomeCompleto(usuarioSalvo.getNomeCompleto())
                .email(usuarioSalvo.getEmail())
                .build();
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiracao = LocalDateTime.now().plusHours(24);

        usuario.setTokenResetSenha(token);
        usuario.setExpiracaoTokenReset(expiracao);

        usuarioRepository.save(usuario);

        // TODO: Implementar envio de email com o token
        log.info("Token de reset de senha gerado para {}: {}", usuario.getEmail(), token);
    }

    public void resetPassword(ResetPasswordRequest request) {
        // Encontrar usuário pelo token de reset
        Usuario usuario = usuarioRepository.findAll().stream()
                .filter(u -> u.getTokenResetSenha() != null && u.getTokenResetSenha().equals(request.getToken()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Token inválido ou expirado"));

        if (usuario.getExpiracaoTokenReset().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expirado");
        }

        usuario.setSenha(passwordEncoder.encode(request.getNovaSenha()));
        usuario.setTokenResetSenha(null);
        usuario.setExpiracaoTokenReset(null);

        usuarioRepository.save(usuario);
    }

    public Usuario findByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
