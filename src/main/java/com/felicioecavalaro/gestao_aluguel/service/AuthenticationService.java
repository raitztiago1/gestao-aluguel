package com.felicioecavalaro.gestao_aluguel.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.dto.ForgotPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginRequest;
import com.felicioecavalaro.gestao_aluguel.dto.LoginResponse;
import com.felicioecavalaro.gestao_aluguel.dto.RegisterRequest;
import com.felicioecavalaro.gestao_aluguel.dto.ResetPasswordRequest;
import com.felicioecavalaro.gestao_aluguel.exception.AuthenticationException;
import com.felicioecavalaro.gestao_aluguel.exception.DuplicateResourceException;
import com.felicioecavalaro.gestao_aluguel.exception.InvalidInputException;
import com.felicioecavalaro.gestao_aluguel.repository.UsuarioRepository;
import com.felicioecavalaro.gestao_aluguel.security.InputSanitizer;
import com.felicioecavalaro.gestao_aluguel.security.PasswordValidator;
import com.felicioecavalaro.gestao_aluguel.security.RateLimiter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PasswordValidator passwordValidator;
    private final InputSanitizer inputSanitizer;
    private final RateLimiter rateLimiter;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public LoginResponse login(LoginRequest request) {
        if (request == null) {
            throw new InvalidInputException("Email e senha são obrigatórios");
        }

        String email = inputSanitizer.sanitizeEmail(request.getEmail());
        String rawSenha = request.getSenha();

        if (rawSenha == null || rawSenha.isBlank()) {
            throw new InvalidInputException("Email e senha são obrigatórios");
        }

        if (rateLimiter.isLocked(email)) {
            String lockMessage = rateLimiter.getLockTimeRemaining(email);
            log.warn("Tentativa de login em conta bloqueada: {}", email);
            throw new AuthenticationException(lockMessage);
        }

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null) {
            passwordEncoder.matches(rawSenha, "$2a$10$fakeHashForTimingProtection1234567890123456");
            rateLimiter.recordAttempt(email);
            throw new AuthenticationException("Email ou senha incorretos");
        }

        if (!usuario.getAtivo()) {
            log.warn("Tentativa de login em usuário inativo: {}", email);
            throw new AuthenticationException("Usuário inativo");
        }

        if (!passwordEncoder.matches(rawSenha, usuario.getSenha())) {
            rateLimiter.recordAttempt(email);
            log.warn("Falha de autenticação para: {}", email);
            throw new AuthenticationException("Email ou senha incorretos");
        }

        rateLimiter.recordSuccess(email);

        String token = jwtService.generateToken(usuario);
        log.info("Login bem-sucedido para: {}", email);

        return LoginResponse.builder()
                .token(token)
                .usuarioId(usuario.getId())
                .nomeCompleto(usuario.getNomeCompleto())
                .email(usuario.getEmail())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        if (request == null) {
            throw new InvalidInputException("Email, senha e nome são obrigatórios");
        }

        String email = inputSanitizer.sanitizeEmail(request.getEmail());
        String nome = inputSanitizer.sanitizeName(request.getNomeCompleto());
        String senha = request.getSenha();

        if (senha == null || senha.isBlank()) {
            throw new InvalidInputException("Email, senha e nome são obrigatórios");
        }

        if (!passwordValidator.isValid(senha)) {
            throw new InvalidInputException(passwordValidator.getRequirements());
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email já cadastrado");
        }

        String senhaEncriptada = passwordEncoder.encode(senha);
        Usuario novoUsuario = Usuario.builder()
                .email(email)
                .senha(senhaEncriptada)
                .nomeCompleto(nome)
                .ativo(true)
                .build();

        Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);
        log.info("Novo usuário registrado: {}", email);

        String token = jwtService.generateToken(usuarioSalvo);
        return LoginResponse.builder()
                .token(token)
                .usuarioId(usuarioSalvo.getId())
                .nomeCompleto(usuarioSalvo.getNomeCompleto())
                .email(usuarioSalvo.getEmail())
                .build();
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null) {
            throw new InvalidInputException("Email é obrigatório");
        }

        String email = inputSanitizer.sanitizeEmail(request.getEmail());
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null) {
            log.debug("Solicitação de redefinição de senha para email inexistente: {}", email);
            return;
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expiracao = LocalDateTime.now().plusHours(24);
        String resetLink = String.format("%s/forgot-password?token=%s", frontendUrl, token);

        usuario.setTokenResetSenha(token);
        usuario.setExpiracaoTokenReset(expiracao);
        usuarioRepository.save(usuario);

        try {
            emailService.sendPasswordResetEmail(usuario.getEmail(), usuario.getNomeCompleto(), resetLink);
            log.info("Token de reset de senha gerado para: {}", email);
        } catch (Exception e) {
            log.warn("Não foi possível enviar email de reset para {}: {}", email, e.getMessage());
        }
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getToken() == null || request.getNovaSenha() == null) {
            throw new InvalidInputException("Token e nova senha são obrigatórios");
        }

        String token = request.getToken().trim();
        String novaSenha = request.getNovaSenha();

        if (token.isEmpty()) {
            throw new InvalidInputException("Token inválido");
        }

        if (!passwordValidator.isValid(novaSenha)) {
            throw new InvalidInputException(passwordValidator.getRequirements());
        }

        Usuario usuario = usuarioRepository.findByTokenResetSenha(token).orElse(null);

        if (usuario == null) {
            log.warn("Tentativa de reset de senha com token inválido");
            throw new AuthenticationException("Token inválido ou expirado");
        }

        if (usuario.getExpiracaoTokenReset() == null
                || usuario.getExpiracaoTokenReset().isBefore(LocalDateTime.now())) {
            usuario.setTokenResetSenha(null);
            usuario.setExpiracaoTokenReset(null);
            usuarioRepository.save(usuario);
            log.warn("Token de reset expirado para: {}", usuario.getEmail());
            throw new AuthenticationException("Token expirado");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setTokenResetSenha(null);
        usuario.setExpiracaoTokenReset(null);
        usuarioRepository.save(usuario);

        log.info("Senha resetada com sucesso para: {}", usuario.getEmail());
    }

    public Usuario findByEmail(String email) {
        String sanitizedEmail = inputSanitizer.sanitizeEmail(email);
        return usuarioRepository.findByEmail(sanitizedEmail)
                .orElseThrow(() -> new AuthenticationException("Usuário não encontrado"));
    }
}
