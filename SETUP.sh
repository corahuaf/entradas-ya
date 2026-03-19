#!/bin/bash

# ==========================================
# SETUP SCRIPT - ENTRADAS-YA SISTEMA POS
# Linux/Mac bash
# ==========================================

set -e

echo "==========================================="
echo "SETUP: Sistema POS + Control de Entradas"
echo "==========================================="
echo ""

# Step 1: Verificar Node.js
echo "[1/5] Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js instalado: $NODE_VERSION"
else
    echo "✗ Node.js no está instalado"
    echo "Descargalo de: https://nodejs.org/"
    exit 1
fi

# Step 2: Verificar PostgreSQL
echo ""
echo "[2/5] Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo "✓ PostgreSQL instalado: $PG_VERSION"
else
    echo "✗ PostgreSQL no está instalado"
    echo "Instala con: brew install postgresql  (Mac) o apt-get install postgresql (Linux)"
    exit 1
fi

# Step 3: Configurar database
echo ""
echo "[3/5] Creando/verificando database..."
read -p "Usuario PostgreSQL (default: postgres): " PG_USER
PG_USER=${PG_USER:-postgres}

read -s -p "Password PostgreSQL: " PG_PASSWORD
echo ""

# Crear database
export PGPASSWORD="$PG_PASSWORD"
psql -U "$PG_USER" -h localhost -c "CREATE DATABASE caja_entradas;" 2>&1 || echo "✓ Database ya existe"
echo "✓ Database 'caja_entradas' lista"

# Step 4: Ejecutar SQL
echo ""
echo "[4/5] Cargando schema y datos..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -f "$SCRIPT_DIR/schema.sql" ]; then
    echo "✗ No found: $SCRIPT_DIR/schema.sql"
    exit 1
fi

psql -U "$PG_USER" -h localhost -d caja_entradas -f "$SCRIPT_DIR/schema.sql"
echo "✓ Schema aplicado"

if [ -f "$SCRIPT_DIR/init-data.sql" ]; then
    psql -U "$PG_USER" -h localhost -d caja_entradas -f "$SCRIPT_DIR/init-data.sql"
    echo "✓ Datos de prueba insertados"
fi

# Step 5: Crear .env.local
echo ""
echo "[5/5] Configurando .env.local..."

ENV_FILE="$SCRIPT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo ".env.local ya existe - Skipiando"
else
    DB_URL="postgresql://$PG_USER:$PG_PASSWORD@localhost:5432/caja_entradas"
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > "$ENV_FILE" << EOF
DATABASE_URL=$DB_URL
JWT_SECRET=$JWT_SECRET
NODE_ENV=development
EOF
    
    echo "✓ .env.local creado"
    echo "  JWT_SECRET: ${JWT_SECRET:0:16}..."
fi

# Instalar dependencias
echo ""
echo "[FINAL] Instalando dependencias npm..."
cd "$SCRIPT_DIR"
npm install

echo ""
echo "==========================================="
echo "✓ SETUP COMPLETADO"
echo "==========================================="
echo ""
echo "Próximos pasos:"
echo "1. npm run dev"
echo "2. Abre http://localhost:5173/login en tu navegador"
echo ""
echo "Credenciales de prueba:"
echo "  admin@sistema.local / admin123"
echo "  juan@sistema.local / admin123"
echo "  maria@sistema.local / admin123"
echo ""
