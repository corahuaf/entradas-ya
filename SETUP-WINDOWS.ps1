# ==========================================
# SETUP SCRIPT - ENTRADAS-YA SISTEMA POS
# Windows PowerShell
# ==========================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SETUP: Sistema POS + Control de Entradas" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verificar Node.js
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = & node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descargalo de: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Step 2: Verificar PostgreSQL
Write-Host ""
Write-Host "[2/5] Verificando PostgreSQL..." -ForegroundColor Yellow
$pgVersion = & psql --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL instalado: $pgVersion" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL no está instalado" -ForegroundColor Red
    Write-Host "Descargalo de: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Step 3: Crear database
Write-Host ""
Write-Host "[3/5] Creando database..." -ForegroundColor Yellow
Write-Host "Ingresa tu usuario de PostgreSQL (default: postgres):"
$pgUser = Read-Host
if ([string]::IsNullOrWhiteSpace($pgUser)) { $pgUser = "postgres" }

Write-Host "Ingresa tu password de PostgreSQL:"
$pgPassword = Read-Host -AsSecureString
$pgPasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($pgPassword))

# Crear la database
$env:PGPASSWORD = $pgPasswordText
& psql -U $pgUser -h localhost -c "CREATE DATABASE caja_entradas;" 2>&1 | Select-String -Pattern "CREATE DATABASE|already exists" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "✓ Database 'caja_entradas' lista" -ForegroundColor Green
} else {
    Write-Host "✗ Error creando database" -ForegroundColor Red
    exit 1
}

# Step 4: Ejecutar schema.sql e init-data.sql
Write-Host ""
Write-Host "[4/5] Cargando schema y datos de prueba..." -ForegroundColor Yellow

$schemaPath = "$PSScriptRoot\schema.sql"
$initDataPath = "$PSScriptRoot\init-data.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Host "✗ No found: $schemaPath" -ForegroundColor Red
    exit 1
}

try {
    & psql -U $pgUser -h localhost -d caja_entradas -f $schemaPath
    Write-Host "✓ Schema aplicado" -ForegroundColor Green
    
    if (Test-Path $initDataPath) {
        & psql -U $pgUser -h localhost -d caja_entradas -f $initDataPath
        Write-Host "✓ Datos de prueba insertados" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error ejecutando SQL" -ForegroundColor Red
    exit 1
}

# Step 5: Crear .env.local
Write-Host ""
Write-Host "[5/5] Configurando .env.local..." -ForegroundColor Yellow

$envPath = "$PSScriptRoot\.env.local"

if (Test-Path $envPath) {
    Write-Host ".env.local ya existe - Skipiando" -ForegroundColor Yellow
} else {
    $dbUrl = "postgresql://$pgUser`:$pgPasswordText@localhost:5432/caja_entradas"
    $jwtSecret = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() -replace "-",""
    
    $envContent = @"
DATABASE_URL=$dbUrl
JWT_SECRET=$jwtSecret
NODE_ENV=development
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✓ .env.local creado" -ForegroundColor Green
    Write-Host "  JWT_SECRET: ${jwtSecret.Substring(0,16)}..." -ForegroundColor Gray
}

# Instalación de dependencias
Write-Host ""
Write-Host "[FINAL] Instalando dependencias npm..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
& npm install
Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. npm run dev" -ForegroundColor White
Write-Host "2. Abre http://localhost:5173/login en tu navegador" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  admin@sistema.local / admin123" -ForegroundColor White
Write-Host "  juan@sistema.local / admin123" -ForegroundColor White
Write-Host "  maria@sistema.local / admin123" -ForegroundColor White
Write-Host ""
