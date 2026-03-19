# 🎯 CHECKLIST EJECUTIVO - PASOS ORDENADOS

**Sistema POS + Entradas v1.0.0** - Guía paso a paso para ponerlo operativo

---

## ⏰ Tiempo Total Estimado: 20-30 minutos

### Fase 1: Preparación (5 min)

#### 1.1 Verificar Node.js instalado
```bash
node --version    # Debe mostrar v18+
npm --version     # Debe mostrar v9+
```

**Si no está instalado:**
- Descargar: https://nodejs.org/ (LTS)
- Instalar y reiniciar terminal

#### 1.2 Verificar PostgreSQL instalado
```bash
psql --version    # Debe mostrar PostgreSQL 12+
```

**Si no está instalado (3 opciones):**
- **Local:** https://www.postgresql.org/download/
- **Neon (recomendado):** https://neon.tech/ (serverless, gratuito)
- **Docker:** `docker run --name postgres -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres`

---

### Fase 2: Configuración (5 min)

#### 2.1 Crear archivo .env.local
```bash
# En raíz del proyecto
cp .env.example .env.local
```

#### 2.2 Editar .env.local con tus credenciales
```bash
# Abrir con editor (VS Code, notepad, etc)
# Windows: notepad .env.local
# Mac: open -a "Visual Studio Code" .env.local

# Editar estas líneas:
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/caja_entradas
JWT_SECRET=tu_secreto_aleatorio_minimum_32_caracteres_12345678901234567890
NODE_ENV=development
```

**Opciones DATABASE_URL:**
- **PostgreSQL Local:** `postgres://postgres:password@localhost:5432/caja_entradas`
- **Neon Cloud:** Copiar desde Neon Dashboard (con ?sslmode=require)

#### 2.3 Guardar archivo
```
Ctrl+S (si usas editor)
```

---

### Fase 3: Base de Datos (5-10 min)

#### 3.1 Crear base de datos (si es local)
```bash
# En terminal
psql -U postgres

# En PostgreSQL terminal
CREATE DATABASE caja_entradas;
\c caja_entradas
```

**Si usas Neon:**
- Ya está creada automáticamente

#### 3.2 Ejecutar schema.sql
```bash
# Opción A: Desde línea de comandos (local)
psql -U postgres -d caja_entradas -f schema.sql

# Opción B: Desde psql terminal
\i schema.sql

# Opción C: DBeaver o pgAdmin
# 1. Conectar a base de datos
# 2. Copiar contenido de schema.sql
# 3. Ejecutar como Query
```

**Verificar tablas creadas:**
```bash
psql -U postgres -d caja_entradas
\dt        # Debe mostrar 6 tablas: usuarios, productos, etc.
```

#### 3.3 Ejecutar init-data.sql (datos de prueba)
```bash
# Opción A: Línea de comandos
psql -U postgres -d caja_entradas -f init-data.sql

# Opción B: psql terminal
\i init-data.sql

# Opción C: DBeaver/pgAdmin (same as schema.sql)
```

**Verificar datos cargados:**
```sql
SELECT COUNT(*) FROM usuarios;        -- Debe mostrar 3
SELECT COUNT(*) FROM productos;       -- Debe mostrar 20+
SELECT COUNT(*) FROM eventos;         -- Debe mostrar 5
SELECT COUNT(*) FROM entradas;        -- Debe mostrar 20+
```

---

### Fase 4: Instalación (3-5 min)

#### 4.1 Instalar dependencias npm
```bash
npm install

# Esperar a que complete (3-5 minutos)
# Debe terminar con: "added XXX packages"
```

#### 4.2 Verificar instalación (opcional)
```bash
npm list bcryptjs
npm list jsonwebtoken
npm list qrcode
# Todos deben mostrar versiones instaladas
```

---

### Fase 5: Inicio (2 min)

#### 5.1 Iniciar servidor de desarrollo
```bash
npm run dev

# Debe mostrar:
# Local:  http://localhost:5173/
# Press h to show help
```

#### 5.2 Abrir en navegador
```
Ir a: http://localhost:5173/login
```

---

### Fase 6: Testing (5-10 min)

#### 6.1 Login
```
Email:    admin@sistema.local
Password: admin123

Click "INICIAR SESIÓN"
```

**Esperado:**
- ✅ Página carga sin errores rojos
- ✅ Redirige a dashboard
- ✅ Muestra "Bienvenido Admin"
- ✅ Navbar visible en la parte superior
- ✅ Menú con 6-9 botones

#### 6.2 Testear módulo CAJA (2 min)
```
1. Click botón "CAJA"
2. Ver lista de productos (izquierda)
3. Click en "Agua (500ml)"
4. Debe aparecer en carrito (derecha)
5. Aumentar cantidad (+)
6. Verificar total se actualiza
7. Seleccionar "EFECTIVO" en método pago
8. Click "COBRAR"
9. Mensaje de éxito
10. Carrito se vacía
```

#### 6.3 Testear módulo VALIDAR (2 min)
```
1. Click botón "VALIDAR ENTRADAS"
2. Ver campo "Código QR"
3. Escribir: EV1-00001
4. Click "BUSCAR"
5. Debe mostrar tarjeta con:
   - Código QR
   - Evento
   - Nombre cliente
   - Estado: DISPONIBLE
6. Click "VALIDAR" (debe estar verde)
7. Estado cambia a VALIDADO en tarjeta
8. Botón "VALIDAR" se deshabilita (gris)
```

#### 6.4 Testear HISTORIAL (1 min)
```
1. Click "HISTORIAL DE VENTAS"
2. Ver cards con números arriba
3. Ver tabla con transacciones
4. Si hiciste venta en CAJA, debe aparecer
```

#### 6.5 Logout (1 min)
```
1. Click botón "LOGOUT" en Navbar (arriba derecha)
2. Debe redirigir a /login
3. Intentar acceder /dashboard manualmente → redirige a login
```

---

## 🆘 Si algo falla

### ❌ "Cannot connect to database"
```
✓ PostgreSQL service está corriendo
✓ DATABASE_URL en .env.local es correcto
✓ Base de datos 'caja_entradas' existe
✓ Usuario/contraseña son válidos
```

→ Ver TROUBLESHOOTING.md sección 1

### ❌ "Token inválido"
```
✓ JWT_SECRET en .env.local tiene 32+ caracteres
✓ Reiniciar server: npm run dev --force
```

→ Ver TROUBLESHOOTING.md sección 2

### ❌ "Credenciales inválidas"
```
✓ Verificar usuarios existen:
  SELECT * FROM usuarios;
✓ Email debe ser: admin@sistema.local (exacto, case-sensitive)
✓ Password debe ser: admin123
```

→ Ver TROUBLESHOOTING.md sección 3

### ❌ "npm install falla"
```bash
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

→ Ver TROUBLESHOOTING.md sección 4

---

## 📚 Documentación Rápida

**Necesitas saber cómo...?**

| Pregunta | Archivo | Sección |
|----------|---------|---------|
| Instalar todo | SETUP.md | Complete Setup |
| Testear sistema | TEST-GUIDE.md | Todos los módulos |
| Resolver error X | TROUBLESHOOTING.md | Sección N |
| Entender arquitectura | README.md | Architecture |
| Estructura archivos | FILE-INDEX.md | Completo |

---

## ✅ Verificación Final

Ejecuta este checklist final:

- [ ] `npm run dev` corre sin errores rojos
- [ ] http://localhost:5173/login carga
- [ ] Login funciona con admin@sistema.local / admin123
- [ ] Dashboard muestra menú
- [ ] CAJA: puedo agregar producto a carrito
- [ ] VALIDAR: puedo buscar entrada y validarla
- [ ] HISTORIAL: veo transacciones registradas
- [ ] LOGOUT: me lleva a login
- [ ] Navbar muestra mi rol (Admin)

**Si TODOS ✅ pasan → Sistema Operativo 🚀**

---

## 🎯 Próximos Pasos (Después de Testing)

1. ✅ **Crear usuarios adicionales** (SQL INSERT en usuarios table)
2. ✅ **Generar eventos reales** (en /eventos page)
3. ✅ **Configurar stock reales** (productos)
4. ✅ **Entrenar al equipo** (credenciales por rol)
5. ✅ **Deploy a producción** (cuando esté validado)

---

## 📞 Soporte Rápido

**Terminal muestra error:**
1. Scrollear arriba en terminal
2. Buscar línea con `Error:`
3. Ir a TROUBLESHOOTING.md
4. Buscar palabra clave del error

**UI no funciona:**
1. Abrir DevTools: F12
2. Console tab: ver errores rojos
3. Network tab: ver si APIs responden 200
4. Verifica .env.local tiene DATABASE_URL

**Base de datos no responde:**
```bash
# Windows
pg_isready -h localhost -p 5432

# Si dice "accepting connections" → OK
# Si no → iniciar PostgreSQL service
```

---

## ⏱️ Timeline Típico

| Fase | Tiempo | Acción |
|------|--------|--------|
| 1. Prep | 5 min | Verificar Node, PG |
| 2. Config | 5 min | .env.local |
| 3. DB | 5-10 min | schema.sql + init-data.sql |
| 4. Install | 3-5 min | npm install |
| 5. Start | 2 min | npm run dev |
| 6. Test | 5-10 min | 6 tests básicos |
| **TOTAL** | **25-40 min** | **Sistema operativo** |

---

## 🎓 Cheat Sheet Comandos

```bash
# Verificar servicios
psql --version           # PostgreSQL
node --version           # Node.js
npm --version            # npm

# Database
psql -U postgres -d caja_entradas
\dt                      # Listar tablas
SELECT COUNT(*) FROM usuarios;
\q                       # Salir

# Node
npm install              # Instalar deps
npm run dev             # Iniciar dev server
npm run build           # Build producción
npm run preview         # Preview build

# Estilos
npm run format          # Format code
npm run lint            # Lint check
```

---

## ✨ Estado Final

**✅ COMPLETAMENTE LISTO PARA OPERACIÓN**

Todos los archivos creados. Documentación completa. Solo necesitas:
1. PostgreSQL configurado
2. npm install ejecutado
3. npm run dev

Y estás operativo en **20-30 minutos.**

---

**Versión:** 1.0.0 Production-Ready
**Fecha:** Ahora
**Status:** ✅ Listo
