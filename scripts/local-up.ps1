<#
.SYNOPSIS
  Sobe o ERP no seu computador (Windows + Docker Desktop): gera as chaves, sobe os containers, cria o banco,
  os dados de exemplo e um usuario para entrar.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\local-up.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\local-up.ps1 -Reset      # apaga o banco local e recomeca
  powershell -ExecutionPolicy Bypass -File .\scripts\local-up.ps1 -NoSeed     # sem os dados de exemplo

  Rode na raiz do projeto ou em qualquer pasta: o script acha a raiz sozinho.
  So dados FICTICIOS: nunca coloque dados reais de clientes neste ambiente.
#>
param(
    [switch]$Reset,
    [switch]$NoSeed,
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin12345"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "`nERRO: $text" -ForegroundColor Red; exit 1 }

# ---- 1. Docker ----
Step "Conferindo o Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Docker nao encontrado. Instale o Docker Desktop e abra-o." }
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail "O Docker Desktop esta fechado. Abra-o, espere ficar verde e rode de novo." }

# ---- 2. .env ----
Step "Preparando o .env"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Criado o .env a partir do .env.example"
}

function Read-Env { [System.IO.File]::ReadAllLines((Join-Path $root ".env")) }
function Get-EnvValue($name) {
    $line = Read-Env | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if ($line) { return $line.Substring($name.Length + 1).Trim() }
    return ""
}
function Set-EnvValue($name, $value) {
    $lines = @(Read-Env)
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^$name=") { $lines[$i] = "$name=$value"; $found = $true }
    }
    if (-not $found) { $lines += "$name=$value" }
    # UTF-8 sem BOM: com BOM a primeira variavel do arquivo seria lida errada.
    [System.IO.File]::WriteAllLines((Join-Path $root ".env"), $lines, (New-Object System.Text.UTF8Encoding $false))
}

$needsKeys = ((Get-EnvValue "JWT_SIGNING_KEY") -in @("", "change-me")) -or ((Get-EnvValue "GATEWAY_CREDENTIALS_KEY") -in @("", "change-me"))
if ($needsKeys) {
    Step "Gerando as chaves (usa um container Python temporario; na primeira vez baixa a imagem)"
    $python = @'
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey as K
from cryptography.hazmat.primitives import serialization as s
from cryptography.fernet import Fernet
pem = K.generate().private_bytes(s.Encoding.PEM, s.PrivateFormat.PKCS8, s.NoEncryption()).decode().strip()
print(pem.replace(chr(10), chr(92) + "n"))
print(Fernet.generate_key().decode())
'@
    $output = $python | docker run --rm -i python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -"
    if ($LASTEXITCODE -ne 0) { Fail "Nao consegui gerar as chaves. Confira a internet e rode de novo." }
    $keys = @($output | Where-Object { $_ -and $_.Trim() })
    if ($keys.Count -ne 2) { Fail "Resposta inesperada ao gerar as chaves: $output" }
    Set-EnvValue "JWT_SIGNING_KEY" $keys[0].Trim()
    Set-EnvValue "GATEWAY_CREDENTIALS_KEY" $keys[1].Trim()
    Write-Host "Chaves gravadas no .env (o .env nao vai para o Git)."
}

# O backend e o frontend precisam do mesmo segredo interno.
if ((Get-EnvValue "INTERNAL_API_KEY") -eq "") {
    $secret = -join ((48..57) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
    Set-EnvValue "INTERNAL_API_KEY" $secret
}

# ---- 3. Containers ----
if ($Reset) {
    Step "Apagando o banco e os arquivos locais (-Reset)"
    docker compose down -v
}
Step "Subindo os containers (a primeira vez demora alguns minutos)"
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Fail "docker compose falhou. Se for 'port is already allocated', ponha POSTGRES_HOST_PORT=5434 no .env e rode de novo." }

Step "Esperando o backend responder"
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $ready) { Fail "O backend nao respondeu em 3 minutos. Veja: docker compose logs backend" }

# ---- 4. Banco e dados ----
Step "Criando as tabelas (migrate)"
docker compose exec -T backend python manage.py migrate
if ($LASTEXITCODE -ne 0) { Fail "migrate falhou. Veja: docker compose logs backend" }

if (-not $NoSeed) {
    Step "Carregando os dados de exemplo (fficticios)"
    docker compose exec -T backend python manage.py seed_demo
    if ($LASTEXITCODE -ne 0) { Fail "seed_demo falhou. Veja: docker compose logs backend" }
}

Step "Criando o usuario para entrar"
docker compose exec -T -e DJANGO_SUPERUSER_USERNAME=$AdminUser -e DJANGO_SUPERUSER_PASSWORD=$AdminPassword backend python manage.py createsuperuser --noinput
if ($LASTEXITCODE -ne 0) { Write-Host "(o usuario '$AdminUser' ja existia: tudo bem)" -ForegroundColor Yellow }

# ---- 5. Pronto ----
Write-Host "`nPronto." -ForegroundColor Green
Write-Host "  Sistema:  http://localhost:3000   (usuario: $AdminUser   senha: $AdminPassword)"
Write-Host "  API:      http://localhost:8000/api/docs/"
Write-Host "  Arquivos: http://localhost:9001   (MinIO, usuario e senha: minioadmin)"
Write-Host "  Parar:    docker compose down        Recomecar do zero: .\scripts\local-up.ps1 -Reset"
Write-Host "  Se http://localhost:3000 nao abrir de primeira, espere 1 minuto (o frontend ainda esta compilando)."
