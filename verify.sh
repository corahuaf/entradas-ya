#!/bin/bash
# Quick verification script for POS + Entradas system
# Run: bash verify.sh (or ./verify.sh if executable)

echo "=================================================="
echo "🔍 Sistema POS + Entradas - Verificación Rápida"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((pass_count++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((fail_count++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Node & npm
echo "📋 Verificando Node.js y npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js instalado ($NODE_VERSION)"
else
    check_fail "Node.js no encontrado"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm instalado ($NPM_VERSION)"
else
    check_fail "npm no encontrado"
fi
echo ""

# 2. Project files
echo "📁 Verificando estructura de archivos..."
FILES=(
    "package.json"
    "schema.sql"
    "init-data.sql"
    "README.md"
    "SETUP.md"
    "TEST-GUIDE.md"
    ".env.example"
    "src/lib/auth.ts"
    "src/hooks.server.ts"
    "src/routes/+page.svelte"
    "src/routes/login/+page.svelte"
    "src/routes/caja/+page.svelte"
    "src/routes/validar/+page.svelte"
    "src/routes/historial/+page.svelte"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "✓ $file existe"
    else
        check_fail "✗ $file NO existe"
    fi
done
echo ""

# 3. Dependencies in package.json
echo "📦 Verificando dependencias en package.json..."
DEPS=("bcryptjs" "jsonwebtoken" "qrcode" "@neondatabase/serverless")
for dep in "${DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        check_pass "$dep en package.json"
    else
        check_fail "$dep NO en package.json"
    fi
done
echo ""

# 4. API endpoints
echo "🔌 Verificando API endpoints..."
API_ROUTES=(
    "src/routes/api/auth/login/+server.ts"
    "src/routes/api/auth/logout/+server.ts"
    "src/routes/api/auth/me/+server.ts"
    "src/routes/api/productos/+server.ts"
    "src/routes/api/ventas/+server.ts"
    "src/routes/api/eventos/+server.ts"
    "src/routes/api/entradas/+server.ts"
    "src/routes/api/reportes/+server.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        check_pass "$route existe"
    else
        check_fail "$route NO existe"
    fi
done
echo ""

# 5. Environment check
echo "⚙️ Verificando configuración..."
if [ -f ".env.local" ]; then
    check_pass ".env.local existe"
    
    if grep -q "DATABASE_URL" .env.local; then
        check_pass "DATABASE_URL configurado"
    else
        check_fail "DATABASE_URL NO configurado"
    fi
    
    if grep -q "JWT_SECRET" .env.local; then
        check_pass "JWT_SECRET configurado"
    else
        check_fail "JWT_SECRET NO configurado"
    fi
else
    check_warn ".env.local NO encontrado (copiar desde .env.example y configurar)"
fi
echo ""

# 6. Database files
echo "🗄️ Verificando scripts de base de datos..."
if [ -f "schema.sql" ]; then
    TABLES=$(grep -c "CREATE TABLE" schema.sql || echo 0)
    if [ "$TABLES" -ge 6 ]; then
        check_pass "schema.sql tiene $TABLES tablas"
    else
        check_fail "schema.sql tiene menos de 6 tablas"
    fi
fi

if [ -f "init-data.sql" ]; then
    INSERTS=$(grep -c "INSERT INTO" init-data.sql || echo 0)
    check_pass "init-data.sql tiene $INSERTS inserts (datos de prueba)"
fi
echo ""

# 7. TypeScript & Svelte files quality
echo "📝 Verificando sintaxis de archivos clave..."
if [ -f "src/app.d.ts" ]; then
    if grep -q "type Locals" src/app.d.ts; then
        check_pass "src/app.d.ts define Locals interface"
    else
        check_fail "Locals interface NO definido"
    fi
fi
echo ""

# 8. Summary
echo "=================================================="
echo "📊 RESUMEN"
echo "=================================================="
echo -e "${GREEN}Pasadas: $pass_count${NC}"
echo -e "${RED}Fallos: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ Sistema listo para testing${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Configurar .env.local (si no está)"
    echo "2. npm install"
    echo "3. Ejecutar: schema.sql + init-data.sql en PostgreSQL"
    echo "4. npm run dev"
    echo "5. Ir a: http://localhost:5173/login"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Faltan archivos/configuración${NC}"
    echo "Verifica los errores arriba"
    echo ""
    exit 1
fi
