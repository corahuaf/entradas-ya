# 🚀 Guía de Setup del Sistema

Esta guía te ayudará a configurar el sistema desde cero.

## 1️⃣ Preparar la Base de Datos

### Opción A: PostgreSQL Local

```bash
# Crear base de datos
createdb caja_entradas

# O con psql
psql -U postgres
CREATE DATABASE caja_entradas;
```

### Opción B: Neon Cloud

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear nuevo proyecto
3. Copiar connection string

## 2️⃣ Ejecutar Schema

```bash
# Desde terminal (PostgreSQL local)
psql -U postgres -d caja_entradas -f schema.sql

# O importar desde cliente gráfico (DBeaver, pgAdmin)
```

## 3️⃣ Actualizar Contraseña Admin

La contraseña inicial en el schema NO está hasheada correctamente. Necesitas generar un hash bcrypt.

### Opción A: Desde Node.js

```bash
node
```

```javascript
const bcrypt = require('bcryptjs');

(async () => {
  const contrasena = 'admin123'; // Cambia esto
  const hash = await bcrypt.hash(contrasena, 10);
  console.log('Hash:', hash);
})();
```

### Opción B: Desde terminal

```bash
npm install bcryptjs -g

# Crear archivo hash.js
echo "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h));" > hash.js
node hash.js
rm hash.js
```

### Actualizar en BD

```sql
UPDATE usuarios 
SET password = '[PASTE_HASH_AQUÍ]'
WHERE email = 'admin@sistema.local';
```

## 4️⃣ Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env.local

# Editar .env.local
nano .env.local  # o tu editor favorito
```

Actualizar:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/caja_entradas
JWT_SECRET=cambiar-esto-en-produccion
NODE_ENV=development
```

## 5️⃣ Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
```

Acceder a: **http://localhost:5173**

## ✅ Verificar Setup

1. Ir a http://localhost:5173/login
2. Ingresar:
   - Email: `admin@sistema.local`
   - Contraseña: la que estableciste
3. Debería redirigir al dashboard

## 🛠️ Crear Usuarios Adicionales

```sql
-- Crear usuario CAJERO
INSERT INTO usuarios (nombre, email, password, rol, estado)
VALUES (
  'Juan Cajero',
  'juan@sistema.local',
  '[HASH_BCRYPT_AQUÍ]',
  'CAJERO',
  'ACTIVO'
);

-- Crear usuario CONTROL DE ENTRADAS
INSERT INTO usuarios (nombre, email, password, rol, estado)
VALUES (
  'María Control',
  'maria@sistema.local',
  '[HASH_BCRYPT_AQUÍ]',
  'CONTROL_ENTRADAS',
  'ACTIVO'
);
```

## 📦 Crear Evento Inicial

```sql
INSERT INTO eventos (nombre, fecha, lugar, estado)
VALUES (
  'Mi Primer Evento',
  CURRENT_DATE + INTERVAL '7 days',
  'Sala Principal',
  'ACTIVO'
);
```

## 🎫 Generar Entradas de Prueba

```sql
-- Primero, obtén el ID del evento creado
SELECT id FROM eventos WHERE nombre = 'Mi Primer Evento';

-- Crear 5 entradas (reemplaza 1 con el ID real)
INSERT INTO entradas (codigo_qr, evento_id, nombre_cliente, estado)
VALUES
  ('EV1-00001', 1, 'Cliente 1', 'DISPONIBLE'),
  ('EV1-00002', 1, 'Cliente 2', 'DISPONIBLE'),
  ('EV1-00003', 1, 'Cliente 3', 'DISPONIBLE'),
  ('EV1-00004', 1, 'Cliente 4', 'DISPONIBLE'),
  ('EV1-00005', 1, 'Cliente 5', 'DISPONIBLE');
```

## 🧪 Pruebas Rápidas

### Test de Login
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.local","password":"admin123"}'
```

### Test de Productos
```bash
curl http://localhost:5173/api/productos
```

### Test de Eventos
```bash
curl http://localhost:5173/api/eventos
```

## 🐛 Problemas Comunes

### Error: "FATAL: role 'postgres' does not exist"
**Solución:** Usar usuario correcto
```bash
psql -U tu_usuario -d caja_entradas -f schema.sql
```

### Error: "sslmode=require" en conexión local
**Solución:** Cambiar CONNECTION_URL para desarrollo
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/caja_entradas
```

### Error: "Cannot find module 'bcryptjs'"
**Solución:** 
```bash
npm install bcryptjs jsonwebtoken qrcode
```

### JWT_SECRET no usado
**Solución:** Asegurar que está define en .env.local
```bash
grep JWT_SECRET .env.local
```

## 📊 Estructura de BD

```
├── usuarios
│   └── Almacena credenciales y roles
├── productos
│   └── Catálogo de artículos
├── ventas
│   └── Registro de transacciones
├── detalle_venta
│   └── Detalles de cada venta
├── eventos
│   └── Información de eventos
└── entradas
    └── Tickets del evento
```

## 🚀 Deploy a Producción

### Variables de Entorno Importantes

```env
NODE_ENV=production
DATABASE_URL=[conexión segura]
JWT_SECRET=[genera con openssl rand -base64 32]
```

### Generar JWT_SECRET Seguro

```bash
openssl rand -base64 32
```

### Build

```bash
npm run build
npm run preview  # Modo preview
```

## 📝 Notas

- Los hashes de contraseña son de una sola dirección (no se pueden desencriptar)
- Los tokens JWT expiran en 24 horas (cambiar en `src/lib/auth.ts`)
- Los códigos QR se generan como texto simple en este demo
- Para producción, implementar HTTPS y CORS

## 🆘 Soporte

Si algo no funciona:

1. Revisar logs en la consola
2. Verificar `.env.local` está correcto
3. Asegurar que BD está corriendo
4. Revisar que `schema.sql` fue ejecutado completamente

---

💡 **Tip:** Guarda este archivo en un lugar seguro. Es información crítica de setup.
