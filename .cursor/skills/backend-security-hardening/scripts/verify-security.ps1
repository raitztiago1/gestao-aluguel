# Verifica gates de segurança do backend — Gestão de Aluguel
# Uso: .\.cursor\skills\backend-security-hardening\scripts\verify-security.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")
Set-Location $repoRoot

Write-Host "=== Backend Security Verification ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot`n"

$failed = $false

function Run-Step {
    param([string]$Name, [string]$Command)
    Write-Host ">> $Name" -ForegroundColor Yellow
    cmd /c "$Command 2>&1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
        $script:failed = $true
    } else {
        Write-Host "OK: $Name`n" -ForegroundColor Green
    }
}

Run-Step "Suite completa" ".\mvnw.cmd test -q"
Run-Step "SecurityFilterChainIntegrationTest" ".\mvnw.cmd `"-Dtest=SecurityFilterChainIntegrationTest`" test -q"
Run-Step "Auth + Upload unit tests" ".\mvnw.cmd `"-Dtest=AuthenticationServiceTest,ContratoDocumentoServiceTest`" test -q"

# Checagens estáticas rápidas
Write-Host ">> Checagens estáticas" -ForegroundColor Yellow

$securityConfig = Get-Content "src\main\java\com\felicioecavalaro\gestao_aluguel\security\SecurityConfig.java" -Raw
if ($securityConfig -match '/api/test/\*\*') {
    Write-Host "WARN: SecurityConfig ainda referencia /api/test/** em permitAll" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "OK: SecurityConfig sem permitAll para /api/test" -ForegroundColor Green
}

$testController = Get-Content "src\main\java\com\felicioecavalaro\gestao_aluguel\controller\TestController.java" -Raw
if ($testController -notmatch '@Profile\("dev"\)') {
    Write-Host "WARN: TestController sem @Profile(`"dev`")" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "OK: TestController restrito ao profile dev" -ForegroundColor Green
}

$props = Get-Content "src\main\resources\application.properties" -Raw
if ($props -match 'LOGIN\s*-\s*admin@') {
    Write-Host "WARN: Credenciais em comentario no application.properties" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "OK: Sem credenciais em comentario (application.properties)" -ForegroundColor Green
}

Write-Host ""
if ($failed) {
    Write-Host "RESULTADO: FALHOU" -ForegroundColor Red
    exit 1
}

Write-Host "RESULTADO: PASSOU - gates de seguranca OK" -ForegroundColor Green
exit 0
