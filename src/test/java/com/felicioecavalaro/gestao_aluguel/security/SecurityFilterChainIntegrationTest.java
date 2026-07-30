package com.felicioecavalaro.gestao_aluguel.security;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.felicioecavalaro.gestao_aluguel.domain.enums.StatusContrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Contrato;
import com.felicioecavalaro.gestao_aluguel.domain.model.Usuario;
import com.felicioecavalaro.gestao_aluguel.repository.UsuarioRepository;
import com.felicioecavalaro.gestao_aluguel.service.ContratoService;
import com.felicioecavalaro.gestao_aluguel.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityFilterChainIntegrationTest {

    private static final String TEST_EMAIL = "security-filter@test.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private ContratoService contratoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setupAuthenticatedUser() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .nomeCompleto("Usuário Teste Segurança")
                .senha("$2a$10$encryptedpassword")
                .ativo(true)
                .build();
        when(usuarioRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(usuario));
    }

    private String bearerToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .nomeCompleto("Usuário Teste Segurança")
                .build();
        return "Bearer " + jwtService.generateToken(usuario);
    }

    @Test
    @DisplayName("T1: GET /api/contratos sem token retorna 401")
    void unauthenticatedContratosReturns401() throws Exception {
        mockMvc.perform(get("/api/contratos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("T2: GET /api/contratos com JWT válido retorna 200")
    void authenticatedContratosReturns200() throws Exception {
        when(contratoService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/contratos")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @DisplayName("T2b: GET /api/contratos inclui campo situacao no JSON")
    void contratosResponseIncludesSituacao() throws Exception {
        Contrato contrato = Contrato.builder()
                .id(1L)
                .status(StatusContrato.ATIVO)
                .build();
        contrato.setSituacao("EM_DIA");
        when(contratoService.findAll()).thenReturn(List.of(contrato));

        mockMvc.perform(get("/api/contratos")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].situacao").value("EM_DIA"));
    }

    @Test
    @DisplayName("T3: POST /api/auth/login é público e alcança o controller")
    void loginEndpointIsPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"publico@test.com","senha":"senha12345"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("T4: POST /api/test/create-test-data sem profile dev retorna 404 ou 401")
    void testEndpointUnavailableWithoutDevProfile() throws Exception {
        mockMvc.perform(post("/api/test/create-test-data"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 404 && status != 401) {
                        throw new AssertionError("Esperado 404 ou 401, obtido " + status);
                    }
                });
    }

    @Test
    @DisplayName("T5: respostas incluem headers de segurança HTTP")
    void securityHeadersPresent() throws Exception {
        when(contratoService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/contratos")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    @DisplayName("T7: upload de arquivo não-PDF retorna 400")
    void uploadNonPdfReturns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.pdf", "application/pdf", "NOT A PDF".getBytes());

        mockMvc.perform(multipart("/api/contratos/1/documento")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Arquivo não é um PDF válido"));
    }

    @Nested
    @DisplayName("T6: registro desabilitado")
    @SpringBootTest
    @AutoConfigureMockMvc
    @ActiveProfiles("test")
    @TestPropertySource(properties = "app.auth.registration-enabled=false")
    class RegisterDisabled {

        @Autowired
        private MockMvc mockMvc;

        @Test
        @DisplayName("POST /api/auth/register retorna 403 quando cadastro público está desabilitado")
        void registerDisabledReturns403() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"novo@test.com","senha":"senha12345","nomeCompleto":"Novo Usuario"}
                                    """))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Cadastro público desabilitado."));
        }
    }
}
