# Troubleshooting Completo - Sistema POS + Entradas

## 🆘 Errores Comunes y Soluciones

### 1. "Cannot connect to database"

**Síntomas:**
- Error al iniciar servidor
- `ECONNREFUSED` o similar
- Todos los endpoints devuelven 500

**Soluciones:**

```bash
# A) Verificar PostgreSQL corre
psql --version
# Si no está instalado: https://www.postgresql.org/download/

# B) Verificar DATABASE_URL en .env.local
cat .env.local | findstr DATABASE_URL  # Windows
grep DATABASE_URL .env.local             # Linux/Mac

# C) Formato correcto de DATABASE_URL
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/caja_entradas
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require  # Neon

# D) Probar conexión manualmente
psql -U postgres -d caja_entradas -c "SELECT 1;"
# Debe retornar: (1 row)

# E) Si usas Neon, verificar:
# - URL en .env.local (copiar de Neon dashboard)
# - sslmode=require al final
# - Base de datos 'caja_entradas' existe en Neon
```

**Si aún falla:**
```sql
-- Desde PostgreSQL terminal
CREATE DATABASE caja_entradas;
\c caja_entradas
-- Luego ejecutar schema.sql
\i schema.sql
```

---

### 2. "JWT_SECRET not provided" o Token errors

**Síntomas:**
- Login falla con "Invalid token"
- Cookie auth_token no se crea
- Todos redirigen a /login

**Soluciones:**

```bash
# A) Verificar JWT_SECRET existe
cat .env.local | findstr JWT_SECRET  # Windows
echo "DATABASE_URL=postgres://..." >> .env.local
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.local

# B) Valor debe ser string aleatorio (32+ caracteres)
# ✓ Válido: "my_super_secret_key_1234567890ab"
# ✓ Válido: "$(openssl rand -hex 32)"
# ✗ Inválido: "" (vacío)
# ✗ Inválido: "123" (muy corto)

# C) Reiniciar servidor después de editar .env.local
npm run dev --force
```

---

### 3. Login falla: "Credenciales inválidas"

**Síntomas:**
- admin@sistema.local + admin123 no funciona
- Otros usuarios tampoco funcionan

**Soluciones:**

```bash
# A) Verificar credenciales en BD
psql -U postgres -d caja_entradas

SELECT email, rol FROM usuarios;
-- Debe mostrar: admin@sistema.local | ADMIN

# B) Verificar password hasheado
SELECT email, password FROM usuarios WHERE email='admin@sistema.local';
-- Debe mostrar un hash bcrypt: $2a$10$...

# C) Si password es NULL o está vacío, actualizar
UPDATE usuarios 
SET password='$2a$10$sI8Qr1DZi2OaTj0o6LAZneasMlzVDEZs2.aLnQODVpS9iMUZU9te'
WHERE email='admin@sistema.local';

# D) Verificar hash corresponde a "admin123"
# El hash arriba es para: admin123 (bcryptjs, 10 salts)

# E) Crear hash nuevo si necesitas cambiar password
# En terminal Node.js:
# const bcrypt = require('bcryptjs');
# bcrypt.hash('tu_password', 10).then(console.log);
```

---

### 4. "npm install fails" o dependencias no instalan

**Síntomas:**
- Error con `bcryptjs` o `jsonwebtoken`
- `npm ERR! peer dep missing`

**Soluciones:**

```bash
# A) Limpiar caché npm
npm cache clean --force

# B) Eliminar node_modules y reinstalar
rm -r node_modules  # Windows: rmdir /s /q node_modules
rm package-lock.json
npm install

# C) Usar npm newer version
npm install -g npm@latest
npm install

# D) Si persiste, instalar individual
npm install bcryptjs@2.4.3 --save
npm install jsonwebtoken@9.1.2 --save
npm install qrcode@1.5.3 --save
```

---

### 5. "Cannot find module '@neondatabase/serverless'"

**Síntomas:**
- Error `MODULE_NOT_FOUND`
- Script falla al conectar DB

**Soluciones:**

```bash
# A) Instalar dependencia faltante
npm install @neondatabase/serverless

# B) Verificar en package.json
cat package.json | grep "@neondatabase"

# C) Si usas PostgreSQL local, comentar en db.js
// import { neon } from '@neondatabase/serverless';
// const sql = neon(process.env.DATABASE_URL);
```

---

### 6. Server crashes: "EACCES: permission denied"

**Síntomas:**
- Server no inicia
- "Permission denied" en logs

**Soluciones:**

```bash
# A) Permisos en archivos
chmod +x src/**/*.ts  # Linux/Mac

# B) Puerto 5173 ocupado
# Cambiar puerto en vite.config.ts
export default {
  server: { port: 3000 }  // o otro puerto disponible
}

# C) Reiniciar terminal/VSCode
# A veces npm cache necesita reset

npm cache clean --force
npm run dev
```

---

### 7. "schema.sql fails" o database tables no existen

**Síntomas:**
- Login page funciona pero "/dashboard" falla
- "relation 'usuarios' does not exist"

**Soluciones:**

```bash
# A) Verificar tablas creadas
psql -U postgres -d caja_entradas -c "\dt"
-- Debe mostrar: usuarios, productos, ventas, detalle_venta, eventos, entradas

# B) Si no hay tablas, ejecutar schema.sql de nuevo
psql -U postgres -d caja_entradas -f schema.sql

# C) Si falla schema.sql, revisar errores
# Ejecutar línea por línea para identificar el problema
psql -U postgres -d caja_entradas
-- Pegar contenido de schema.sql en terminal

# D) Dropear y recrear todo
DROP DATABASE IF EXISTS caja_entradas;
CREATE DATABASE caja_entradas;
\c caja_entradas
-- Ejecutar schema.sql
```

---

### 8. "datos de prueba no cargan" (init-data.sql fails)

**Síntomas:**
- CAJA está vacío (sin productos)
- VALIDAR no hay entradas

**Soluciones:**

```bash
# A) Ejecutar init-data.sql
psql -U postgres -d caja_entradas -f init-data.sql

# B) Verificar datos
psql -U postgres -d caja_entradas -c "SELECT COUNT(*) FROM productos;"
-- Debe retornar: 20+

psql -U postgres -d caja_entradas -c "SELECT COUNT(*) FROM entradas;"
-- Debe retornar: 20+

# C) Si fallan los inserts, pueden ser conflictos
# Limpiar y reintentar
DELETE FROM detalle_venta;
DELETE FROM ventas;
DELETE FROM productos;
DELETE FROM eventos;
DELETE FROM entradas;
DELETE FROM usuarios WHERE email != 'admin@sistema.local';

-- Luego ejecutar init-data.sql nuevamente
```

---

### 9. CAJA: "Producto no aparece en lista"

**Síntomas:**
- Creo producto pero no se ve
- Lista siempre está vacía

**Soluciones:**

```bash
# A) Verificar estado del producto
SELECT nombre, estado, stock FROM productos LIMIT 5;
-- Deben tener estado='ACTIVO' y stock > 0

# B) Productos creados correctamente pero estado incorrecto
UPDATE productos SET estado='ACTIVO' WHERE estado IS NULL;
UPDATE productos SET stock=100 WHERE stock <= 0;

# C) Reload página en navegador
Ctrl+R o Cmd+R (hard refresh)

# D) Verificar endpoint /api/productos
# Abrir DevTools (F12) → Network → buscar "productos" GET
-- Debe retornar JSON con products array
-- Deben tener estado="ACTIVO"
```

---

### 10. VALIDAR: "Entrada no encontrada"

**Síntomas:**
- Código QR existe en BD pero búsqueda retorna null
- "Entrada not found" en tarjeta roja

**Soluciones:**

```bash
# A) Verificar código existe exacto
psql -U postgres -d caja_entradas -c \
  "SELECT codigo_qr FROM entradas LIMIT 5;"

# B) Código es case-sensitive
-- EV1-00001 ≠ ev1-00001
-- Usar código exacto como aparece en BD

# C) Verificar evento_id existe
SELECT codigo_qr, evento_id FROM entradas LIMIT 5;
SELECT id FROM eventos;
-- evento_id de entrada debe existir en eventos

# D) Datos corruptos, recrear
DELETE FROM entradas;
-- Ejecutar sección insert de init-data.sql nuevamente
```

---

### 11. "No se ve Navbar" o Layout rotos

**Síntomas:**
- Páginas sin header/footer
- Navbar desaparece en algunas rutas

**Soluciones:**

```bash
# A) Verificar Navbar.svelte existe
ls src/lib/components/Navbar.svelte

# B) Verificar import en páginas
# En cada page.svelte debe tener:
<script>
  import Navbar from '$lib/components/Navbar.svelte';
</script>

<Navbar />
<!-- resto del contenido -->

# C) CSS layout.css roto
# Verificar src/routes/layout.css existe y tiene estilos base

# D) Reload & clear cache
npm run dev --force
# Abrir en incógnito o limpiar cookies del navegador
```

---

### 12. "Rol-based menu no funciona" (all pages visible)

**Síntomas:**
- CAJERO ve botón PRODUCTOS (no debería)
- CONTROL_ENTRADAS puede entrar a CAJA
- No hay restricción de rutas

**Soluciones:**

```bash
# A) Verificar hooks.server.ts
cat src/hooks.server.ts
-- Debe tener requireAuth() y requireRole()

# B) Verificar cada page.ts tiene guards
# +page.ts o +page.server.ts en ruta debe tener:
import { redirect } from '@sveltejs/kit';
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  // Validar rol si necesario
}

# C) Si falta guards, están rotos los routes
-- Verificar sintaxis de guard functions

# D) Cookie auth_token corrupta
-- Logout y volver a login para renovar
```

---

### 13. "Vendedor (CAJERO) ve panel ADMIN"

**Síntomas:**
- Usuarios con rol CAJERO ven PRODUCTOS, EVENTOS, USUARIOS
- Permiso RBAC (role-based access control) no funciona

**Soluciones:**

```bash
# A) Verificar rol en BD
SELECT email, rol FROM usuarios;
-- Confirmar CAJERO tiene rol='CAJERO' exacto

# B) Verificar rol en JWT token
-- En login, console.log del token decodificado
-- Debe mostrar: { id, email, rol: 'CAJERO' }

# C) Verificar lógica menú en dashboard
cat src/routes/+page.svelte
-- Buscar: { showCaja: locals.user?.rol === 'ADMIN' }
-- Debe validar correctamente por rol

# D) Limpiar localStorage y cookies
-- F12 → Application → Clear site data → Reload
```

---

### 14. REPORTES: "Números incorrectos o no actualizan"

**Síntomas:**
- Total de ventas no coincide
- Reporte con datos viejos

**Soluciones:**

```bash
# A) Verificar queries en /api/reportes
cat src/routes/api/reportes/+server.ts

# B) Ejecutar queries manualmente
SELECT SUM(total) FROM ventas WHERE DATE(fecha) = CURRENT_DATE;
SELECT COUNT(*) FROM entradas WHERE estado='VALIDADO' AND DATE(fecha_validacion) = CURRENT_DATE;

# C) Comparar con reportes en UI
-- Números deben coincidir exactamente

# D) Si estilo 24h anterior (ayer)
-- Verificar timezone del servidor
-- Puede ser diferente al cliente

# E) Limpiar caché de reportes
-- Reload página (Ctrl+R)
-- O cambiar report type y volver
```

---

### 15. "Stock no se decrementa después de venta"

**Síntomas:**
- Compro 5 Aguas, stock sigue igual
- Venta registra pero productos no actualizan

**Soluciones:**

```bash
# A) Verificar endpoint /api/ventas procesa stock
cat src/routes/api/ventas/+server.ts
-- Debe tener: UPDATE productos SET stock = stock - ?

# B) Ejecutar manualmente
SELECT id, nombre, stock FROM productos WHERE nombre='Agua (500ml)' LIMIT 1;
-- Anotar stock_antes

-- Hacer compra desde UI

SELECT stock FROM productos WHERE nombre='Agua (500ml)';
-- stock_después debe ser: stock_antes - cantidad_comprada

# C) Si no se actualiza, trigger cron fallido
-- Revisar código POST en /api/ventas
-- Debe tener UPDATE IMMEDIATE (no con delay)

# D) Transacción sin commit
-- Código puede tener error y rollback sin mensaje
```

---

### 16. "Servidor lento" o timeouts

**Síntomas:**
- Botones toman mucho para responder
- Network requests tardan >5 segundos

**Soluciones:**

```bash
# A) Verificar conexión BD es lenta
time psql -U postgres -d caja_entradas -c "SELECT COUNT(*) FROM usuarios;"
-- Si tarda >1s, problema de DB

# B) Indexes faltantes
psql -U postgres -d caja_entradas -c "\d usuarios"
-- Buscar: "Indexes"
-- Si no ve indexes, schema.sql puede ser incompleto

# C) Neon free tier slower
-- Si usas Neon trial, puede ser lento
-- Considerar upgrade o instancia local

# D) Demasiadas queries N+1
-- Debug en Network tab (F12)
-- Ver si cada acción hace demasiadas queries

# E) Rebuild vite
npm run build
npm run preview
```

---

### 17. "logout no funciona" o sesión persiste

**Síntomas:**
- Click logout, pero sigue logged in
- Cookie no se borra
- Login puede hacer refresh y entra

**Soluciones:**

```bash
# A) Verificar endpoint /api/auth/logout
cat src/routes/api/auth/logout/+server.ts
-- Debe tener: cookies.delete('auth_token', {...})

# B) Verificar cookie se borra
F12 → Application → Cookies → localhost → auth_token
-- Antes logout: debe existir
-- Después logout: debe estar vacía o NO EXISTIR

# C) Manualmente borrar cookie
// En consola del navegador
document.cookie = "auth_token=;max-age=0;path=/";
location.href = '/login';

# D) Cookie options pueden ser incorrectas
-- Verificar: path='/', httpOnly=true, secure para HTTPS

# E) Verificar redirige a /login después logout
-- Debe tener redirect(303, '/login') en handler
```

---

### 18. "Archivos CSS no cargan" o estilos rotos

**Síntomas:**
- UI sin colores, muy desalineada
- Botones no centrados

**Soluciones:**

```bash
# A) Verificar archivos CSS existen
ls src/app.css
ls src/routes/layout.css

# B) Verificar imports en +layout.svelte
cat src/routes/+layout.svelte
-- Debe tener: import '../app.css';

# C) Clear CSS cache
-- F12 → Network → Disable cache (check mientras devuelves)
-- Reload página

# D) Vite assets hashing
-- A veces CSS tiene hash y no carga
-- Reiniciar dev server: Ctrl+C → npm run dev

# E) Conflicto con estilos globales
-- Revisar app.css vs layout.css
-- No duplicar estilos body, html
```

---

### 19. "TypeScript errors" en consola/build

**Síntomas:**
- `tsc --noEmit` falla
- Build no completa

**Soluciones:**

```bash
# A) Check TypeScript version
npm list typescript

# B) Verificar tipos en app.d.ts
cat src/app.d.ts
-- Debe tener: declare global { namespace App { interface Locals { ... } } }

# C) Regenrar types
npm run build -- --mode development

# D) Si persiste, ignorar TS en build
# vite.config.ts: add { ssr: { external: ['pg'] } }

# E) Clear .svelte-kit cache
rm -rf .svelte-kit
npm run dev
```

---

### 20. "Base de datos llena" o performance degrada

**Síntomas:**
- Sistema lento después de muchas transacciones
- Queries toman segundos

**Soluciones:**

```bash
# A) Limpiar datos de prueba viejos
DELETE FROM detalle_venta   WHERE fecha_venta < NOW() - INTERVAL '30 days';
DELETE FROM ventas          WHERE fecha < NOW() - INTERVAL '30 days';
DELETE FROM entradas        WHERE fecha_compra < NOW() - INTERVAL '30 days';

# B) Vacunar BD
VACUUM ANALYZE;

# C) Verificar indexes
SELECT * FROM pg_stat_user_indexes;
-- Deben tener: idx_usuarios_email, idx_productos_estado, etc.

# D) Backup antes de limpiar
pg_dump caja_entradas > backup-$(date +%Y%m%d).sql

# E) Si sigue lento, considerar:
-- Archivado de datos viejos
-- Particionamiento de tablas grandes
```

---

## 🔗 Recursos Útiles

### PostgreSQL
- **Descargar:** https://www.postgresql.org/download/
- **Docs:** https://www.postgresql.org/docs/
- **Herramientas UI:** DBeaver, pgAdmin4

### JavaScript/Node
- **Node.js:** https://nodejs.org/
- **bcryptjs docs:** https://www.npmjs.com/package/bcryptjs
- **jsonwebtoken docs:** https://www.npmjs.com/package/jsonwebtoken

### SvelteKit
- **Official:** https://kit.svelte.dev/
- **Docs:** https://kit.svelte.dev/docs
- **Community:** https://discord.gg/svelte

### Neon (si usas serverless)
- **Neon:** https://neon.tech/
- **Docs:** https://neon.tech/docs/introduction

---

## 🎯 Checklist si nada funciona

- [ ] PostgreSQL corriendo (`psql --version`)
- [ ] `.env.local` con DATABASE_URL y JWT_SECRET válidos
- [ ] `npm install` completó sin errores
- [ ] `schema.sql` ejecutado (`\dt` muestra 6 tablas)
- [ ] `init-data.sql` ejecutado (usuarios/productos/eventos/entradas existen)
- [ ] `npm run dev` sin errores en server
- [ ] Navegador en http://localhost:5173 (no 3000)
- [ ] Login con admin@sistema.local / admin123
- [ ] DevTools (F12) → No hay errores rojo
- [ ] DevTools → Network → requests a `/api/*` (200)
- [ ] Browser cookie `auth_token` existe después login

Si aún no funciona, ejecuta:
```bash
npm run dev --force
# En otra terminal
npm run build
```

Y adjunta los errores al reportar bug.
