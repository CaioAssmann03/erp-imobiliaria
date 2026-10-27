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

# O Docker escreve avisos e o progresso no canal de erro (stderr). No PowerShell isso vira "erro" e, com
# $ErrorActionPreference = "Stop", derruba o script mesmo quando o comando deu certo. Por isso todo comando
# do Docker passa por aqui; quem decide se falhou e o codigo de saida ($LASTEXITCODE).
function Native([scriptblock]$Command) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { & $Command } finally { $ErrorActionPreference = $previous }
}

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "`nERRO: $text" -ForegroundColor Red; exit 1 }

# ---- 1. Docker ----
Step "Conferindo o Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Docker nao encontrado. Instale o Docker Desktop e abra-o." }
Native { docker info *> $null }
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
    $output = Native { $python | docker run --rm -i python:3.12-slim sh -c "pip install -q cryptography >/dev/null 2>&1 && python -" 2>$null }
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
    Native { docker compose down -v }
}

# A porta do Postgres no seu computador costuma estar ocupada por outro projeto. Se a escolhida estiver, o script
# acha a proxima livre e grava no .env (so isso muda; dentro do Docker o banco continua na 5432).
function Test-PortFree([int]$port) {
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start(); $listener.Stop(); return $true
    } catch { return $false }
}
$alreadyPublished = Native { docker compose port db 5432 2>$null }
if (-not $alreadyPublished) {
    $dbPort = Get-EnvValue "POSTGRES_HOST_PORT"
    if (-not $dbPort) { $dbPort = "5432" }
    $port = [int]$dbPort
    if (-not (Test-PortFree $port)) {
        while (-not (Test-PortFree $port)) { $port++ }
        Set-EnvValue "POSTGRES_HOST_PORT" "$port"
        Write-Host "A porta $dbPort do Postgres estava ocupada: usando a $port (gravado no .env)." -ForegroundColor Yellow
    }
}
Step "Subindo os containers (a primeira vez demora alguns minutos)"
Native { docker compose up -d --build }
if ($LASTEXITCODE -ne 0) {
    Fail ("docker compose falhou. Leia a mensagem acima. Se for 'port is already allocated': a porta citada esta ocupada por outro programa " +
          "(8000 = outro backend, 3000 = outro frontend, 9090 = outro armazenamento, 5432 = outro Postgres: nesse caso ponha POSTGRES_HOST_PORT=5434 no .env). " +
          "Feche o programa que usa a porta (docker ps mostra os containers) e rode de novo.")
}

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
Native { docker compose exec -T backend python manage.py migrate }
if ($LASTEXITCODE -ne 0) { Fail "migrate falhou. Veja: docker compose logs backend" }

if (-not $NoSeed) {
    Step "Carregando os dados de exemplo (ficticios)"
    Native { docker compose exec -T backend python manage.py seed_demo }
    if ($LASTEXITCODE -ne 0) { Fail "seed_demo falhou. Veja: docker compose logs backend" }
}

Step "Criando o usuario para entrar"
Native { docker compose exec -T -e DJANGO_SUPERUSER_USERNAME=$AdminUser -e DJANGO_SUPERUSER_PASSWORD=$AdminPassword backend python manage.py createsuperuser --noinput }
if ($LASTEXITCODE -ne 0) { Write-Host "(o usuario '$AdminUser' ja existia: tudo bem)" -ForegroundColor Yellow }

# ---- 5. Pronto ----
Write-Host "`nPronto." -ForegroundColor Green
Write-Host "  Sistema:  http://localhost:3000   (usuario: $AdminUser   senha: $AdminPassword)"
Write-Host "  API:      http://localhost:8000/api/docs/"
Write-Host "  Arquivos: armazenamento S3 local em http://localhost:9090 (usado pelo PDF do boleto)"
Write-Host "  Parar:    docker compose down        Recomecar do zero: .\scripts\local-up.ps1 -Reset"
Write-Host "  Se http://localhost:3000 nao abrir de primeira, espere 1 minuto (o frontend ainda esta compilando)."
