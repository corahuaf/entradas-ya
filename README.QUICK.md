# QUICK START - 5 MINUTOS

## Requisitos
- Node.js 18+
- PostgreSQL 13+

## Pasos

### 1. Windows (PowerShell)
```powershell
# Ejecuta el script de setup
.\SETUP-WINDOWS.ps1

# Inicia el servidor
npm run dev
```

### 2. Linux/Mac (Bash)
```bash
# Dale permisos al script
chmod +x SETUP.sh

# Ejecuta el setup
./SETUP.sh

# Inicia el servidor
npm run dev
```

### 3. Abre en navegador
```
http://localhost:5173/login
```

### 4. Login
```
Usuario: admin@sistema.local
Password: admin123
```

## Qué hace el script

1. ✓ Crea la database `caja_entradas`
2. ✓ Carga el schema (6 tablas)
3. ✓ Inserta datos de prueba (3 usuarios, 20 productos, 5 eventos)
4. ✓ Crea `.env.local` con DATABASE_URL y JWT_SECRET
5. ✓ Instala dependencias npm

## Usuarios disponibles

| Email | Password | Rol |
|-------|----------|-----|
| admin@sistema.local | admin123 | ADMIN |
| juan@sistema.local | admin123 | CAJERO |
| maria@sistema.local | admin123 | CONTROL_ENTRADAS |

## Funcionalidades principales

- **Dashboard:** Menú de navegación por rol
- **CAJA:** POS con carrito, productos, 4 métodos de pago
- **VALIDAR ENTRADAS:** Buscar/ValidarQR
- **PRODUCTOS:** Gestión de catálogo
- **EVENTOS:** Gestión de eventos
- **REPORTES:** Ventas, entradas, stock
- **HISTORIAL:** Transacciones pasadas

## Estructura de archivos

```
schema.sql              ← Database schema
init-data.sql           ← Test data
SETUP-WINDOWS.ps1       ← Auto setup (Windows)
SETUP.sh                ← Auto setup (Linux/Mac)
src/
  lib/auth.ts           ← Autenticación
  routes/
    login/              ← Login page
    +page.svelte        ← Dashboard
    caja/               ← POS system
    validar/            ← Ticket validation
    etc/
  api/
    auth/               ← JWT endpoints
    productos/          ← Product CRUD
    ventas/             ← Sales
    etc/
```

## Troubleshooting

**"psql: command not found"**
- Instala PostgreSQL: https://postgresql.org/download/

**Puerto 5173 ya está en uso**
```bash
npm run dev -- --port 5174
```

**Database connection error**
- Revisa DATABASE_URL en `.env.local`
- Verifica que PostgreSQL esté corriendo
- ```bash
  psql -U postgres -d caja_entradas
  ```

**Datos de prueba no aparecen**
- Ejecuta: `psql -U postgres -d caja_entradas -f init-data.sql`

para más detalles, ver `README.md` y `SETUP.md`
