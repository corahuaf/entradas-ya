# Quick Start Script para Windows PowerShell
# Run: .\quickstart.ps1

Write-Host "=================================================="
Write-Host "🚀 Sistema POS + Entradas - Quick Start Windows"
Write-Host "=================================================="
Write-Host ""

# Colores
$Success = "Green"
$Error = "Red"
$Warning = "Yellow"
$Info = "Cyan"

# 1. Verificar Node.js
Write-Host "📋 Paso 1: Verificando Node.js..."
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion instalado" -ForegroundColor $Success
}
catch {
    Write-Host "✗ Node.js no encontrado. Descargar desde: https://nodejs.org" -ForegroundColor $Error
    exit 1
}

# 2. Verificar archivos
Write-Host ""
Write-Host "📁 Paso 2: Verificando archivos..."
$requiredFiles = @(
    "package.json",
    "schema.sql",
    "init-data.sql",
    ".env.example"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file existe" -ForegroundColor $Success
    }
    else {
        Write-Host "✗ $file NO EXISTE" -ForegroundColor $Error
        exit 1
    }
}

# 3. Configurar .env.local
Write-Host ""
Write-Host "⚙️ Paso 3: Configurando .env.local..."
if (!(Test-Path ".env.local")) {
    Write-Host "Creando .env.local desde .env.example..." -ForegroundColor $Warning
    Copy-Item .env.example .env.local
    Write-Host "✓ Archivo creado. Editar ahora: .env.local`n" -ForegroundColor $Warning
    Write-Host "NECESITAS CONFIGURAR:" -ForegroundColor $Warning
    Write-Host "  • DATABASE_URL=postgres://usuario:password@host/database" -ForegroundColor $Warning
    Write-Host "  • JWT_SECRET=tu_secreto_aleatorio_aqui" -ForegroundColor $Warning
    Write-Host ""
    
    $proceed = Read-Host "¿Ya configuraste .env.local? (s/n)"
    if ($proceed -ne "s") {
        Write-Host "✗ Configura .env.local antes de continuar" -ForegroundColor $Error
        Write-Host "  Edita el archivo y re-ejecuta este script" -ForegroundColor $Warning
        exit 1
    }
}
else {
    Write-Host "✓ .env.local existe" -ForegroundColor $Success
}

# 4. PostgreSQL check
Write-Host ""
Write-Host "🗄️ Paso 4: Verificando PostgreSQL..."
Write-Host "¿PostgreSQL está corriendo?" -ForegroundColor $Warning
Write-Host "  • Si es local: Abre PgAdmin o ejecuta: psql -U postgres" -ForegroundColor $Info
Write-Host "  • Si es Neon: URL debe estar en DATABASE_URL" -ForegroundColor $Info
Write-Host ""

$pgReady = Read-Host "¿PostgreSQL está listo? (s/n)"
if ($pgReady -ne "s") {
    Write-Host "✗ Inicia PostgreSQL primero" -ForegroundColor $Error
    exit 1
}

# 5. Install dependencies
Write-Host ""
Write-Host "📦 Paso 5: Instalando dependencias npm..."
Write-Host "Ejecutando: npm install" -ForegroundColor $Info
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install falló" -ForegroundColor $Error
    exit 1
}
Write-Host "✓ Dependencias instaladas" -ForegroundColor $Success

# 6. Database setup
Write-Host ""
Write-Host "🗄️ Paso 6: Configurando base de datos..."
Write-Host "Necesitas executar MANUALMENTE:" -ForegroundColor $Warning
Write-Host ""
Write-Host "OPCIÓN A - PostgreSQL Local:" -ForegroundColor $Info
Write-Host "  psql -U postgres -d caja_entradas -f schema.sql" -ForegroundColor $Warning
Write-Host "  psql -U postgres -d caja_entradas -f init-data.sql" -ForegroundColor $Warning
Write-Host ""
Write-Host "OPCIÓN B - DBeaver o pgAdmin:" -ForegroundColor $Info
Write-Host "  1. Abre DBeaver o pgAdmin" -ForegroundColor $Warning
Write-Host "  2. Selecciona database 'caja_entradas'" -ForegroundColor $Warning
Write-Host "  3. Copia contenido de schema.sql y ejecuta" -ForegroundColor $Warning
Write-Host "  4. Copia contenido de init-data.sql y ejecuta" -ForegroundColor $Warning
Write-Host ""
Write-Host "OPCIÓN C - PowerShell (con psql en PATH):" -ForegroundColor $Info
Write-Host "  & psql -U postgres -d caja_entradas -f schema.sql" -ForegroundColor $Warning
Write-Host "  & psql -U postgres -d caja_entradas -f init-data.sql" -ForegroundColor $Warning
Write-Host ""

$dbReady = Read-Host "¿Ya ejecutaste schema.sql e init-data.sql? (s/n)"
if ($dbReady -ne "s") {
    Write-Host "⚠️  Ejecuta los scripts antes de continuar" -ForegroundColor $Warning
    exit 1
}

# 7. Start dev server
Write-Host ""
Write-Host "✅ Paso 7: Iniciando servidor de desarrollo..."
Write-Host "Ejecutando: npm run dev" -ForegroundColor $Info
Write-Host ""
Write-Host "🎯 Sistema listo en: http://localhost:5173" -ForegroundColor $Success
Write-Host ""
Write-Host "📝 Credenciales de prueba:" -ForegroundColor $Info
Write-Host "  admin@sistema.local     / admin123" -ForegroundColor $Warning
Write-Host "  juan@sistema.local      / admin123 (CAJERO)" -ForegroundColor $Warning
Write-Host "  maria@sistema.local     / admin123 (CONTROL)" -ForegroundColor $Warning
Write-Host ""

npm run dev
