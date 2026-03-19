# ARQUITECTURA DEL SISTEMA

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (iPad/Desktop)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                        SvelteKit App                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  Pages (Svelte Components)                               │   │
│  │  ├─ Login               (formulario)                      │   │
│  │  ├─ Dashboard           (menú por rol)                   │   │
│  │  ├─ POS/CAJA            (carrito + pago)                │   │
│  │  ├─ Validar Entradas    (búsqueda QR)                   │   │
│  │  ├─ Productos           (CRUD)                           │   │
│  │  ├─ Eventos             (CRUD)                           │   │
│  │  ├─ Historial           (reporte ventas)                │   │
│  │  └─ Reportes            (4 tipos)                        │   │
│  │                                                            │   │
│  │  Navbar.svelte          (usuario + logout)              │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│                       HTTP Requests                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js / SvelteKit Server                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Middleware (hooks.server.ts)                                   │
│  ├─ handle()     ← Extrae JWT de cookies                        │
│  ├─ verifyToken() ← Validates JWT                               │
│  └─ inject user → locals.user                                   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             Authentication Layer (src/lib/auth.ts)        │   │
│  │ ├─ hashPassword()    ← bcryptjs                           │   │
│  │ ├─ verifyPassword()  ← compare                            │   │
│  │ ├─ generateToken()   ← JWT 24h                            │   │
│  │ ├─ verifyToken()     ← decode & verify                    │   │
│  │ └─ hasPermission()   ← role checking                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Routes (/api/*)                          │   │
│  │                                                            │   │
│  │  ┌─ Auth Endpoints                                       │   │
│  │  │  ├─ POST   /api/auth/login      ← email + password   │   │
│  │  │  ├─ POST   /api/auth/logout     ← clear session      │   │
│  │  │  └─ GET    /api/auth/me         ← user info          │   │
│  │  │                                                        │   │
│  │  ├─ Productos Endpoints                                 │   │
│  │  │  ├─ GET    /api/productos       ← list               │   │
│  │  │  ├─ POST   /api/productos       ← create (ADMIN)     │   │
│  │  │  ├─ PUT    /api/productos/[id]  ← update (ADMIN)     │   │
│  │  │  └─ DELETE /api/productos/[id]  ← delete (ADMIN)     │   │
│  │  │                                                        │   │
│  │  ├─ Ventas Endpoints                                    │   │
│  │  │  ├─ GET    /api/ventas          ← list               │   │
│  │  │  └─ POST   /api/ventas          ← register (CAJERO)  │   │
│  │  │              └─ Decrementa stock automáticamente      │   │
│  │  │                                                        │   │
│  │  ├─ Entradas Endpoints                                  │   │
│  │  │  ├─ GET    /api/entradas        ← list (filterable)  │   │
│  │  │  ├─ POST   /api/entradas        ← create (ADMIN)     │   │
│  │  │  ├─ GET    /api/entradas/[qr]   ← lookup             │   │
│  │  │  └─ PUT    /api/entradas/[qr]   ← validate (CONTROL) │   │
│  │  │                                                        │   │
│  │  ├─ Eventos Endpoints                                   │   │
│  │  │  ├─ GET    /api/eventos         ← list               │   │
│  │  │  └─ POST   /api/eventos         ← create (ADMIN)     │   │
│  │  │                                                        │   │
│  │  └─ Reportes Endpoints                                  │   │
│  │     ├─ GET    /api/reportes?tipo=ventas-dia             │   │
│  │     ├─ GET    /api/reportes?tipo=entradas-validadas     │   │
│  │     ├─ GET    /api/reportes?tipo=entradas-disponibles   │   │
│  │     └─ GET    /api/reportes?tipo=productos-vendidos     │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Database Layer (Neon/PostgreSQL)              │   │
│  │  ├─ @neondatabase/serverless driver                     │   │
│  │  └─ Prepared statements (no SQL injection)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Usuarios Table                         │   │
│  │ ├─ id (PK)                                               │   │
│  │ ├─ nombre                                                │   │
│  │ ├─ email (UNIQUE)                                        │   │
│  │ ├─ password (bcryptjs hash)                              │   │
│  │ ├─ rol (ENUM: ADMIN, CAJERO, CONTROL_ENTRADAS)         │   │
│  │ └─ estado (ACTIVE/INACTIVE)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ↓ FK                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Productos Table                          │   │
│  │ ├─ id (PK)                                               │   │
│  │ ├─ nombre                                                │   │
│  │ ├─ precio DECIMAL(10,2)                                  │   │
│  │ ├─ stock INT                                             │   │
│  │ └─ estado (ACTIVE/INACTIVE)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│          │                                   │                   │
│          ↓ FK                                 ↓ FK                │
│  ┌─────────────────────────────────────────────────────┐    ┌──┐│
│  │        Ventas Table            Detalle_Venta Table │    │DO││
│  │ ├─ id (PK)                     ├─ venta_id (FK) ───┼─→◆─┤CO││
│  │ ├─ fecha TIMESTAMP             ├─ producto_id (FK)─┼──→◆─┤PE││
│  │ ├─ total DECIMAL               ├─ cantidad          │    │AR││
│  │ ├─ metodo_pago (ENUM)          ├─ precio            │    │TI││
│  │ ├─ usuario_id (FK) ────────┐   ├─ subtotal          │    │CU││
│  │ └─ estado                   │   └─ estado            │    │LO││
│  └─────────────────────────────┼─────────────────────┘    └──┘│
│          ↑ FK                   │                               │
│          └─────────────────────┘                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Eventos Table                            │   │
│  │ ├─ id (PK)                                               │   │
│  │ ├─ nombre                                                │   │
│  │ ├─ fecha DATE                                            │   │
│  │ ├─ lugar                                                 │   │
│  │ └─ estado (ACTIVE/INACTIVE)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│          ↓ FK                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Entradas Table                           │   │
│  │ ├─ id (PK)                                               │   │
│  │ ├─ codigo_qr (UNIQUE, VARCHAR)  ← QR Code               │   │
│  │ ├─ evento_id (FK)                                        │   │
│  │ ├─ nombre_cliente                                        │   │
│  │ ├─ estado (DISPONIBLE, VALIDADO, ANULADO)               │   │
│  │ ├─ fecha_compra TIMESTAMP                                │   │
│  │ ├─ fecha_validacion TIMESTAMP (nullable)                 │   │
│  │ └─ usuario_validador_id (FK, nullable)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Indexes:                                                        │
│  ├─ usuarios (email)                                            │
│  ├─ productos (estado)                                          │
│  ├─ ventas (fecha, usuario_id)                                 │
│  ├─ eventos (estado)                                            │
│  └─ entradas (codigo_qr, evento_id, estado)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos - POS Workflow

```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │ Click "CAJA"
       ↓
┌─────────────────────────┐
│   GET /api/productos    │
│  (GET productos activos)│
└──────┬──────────────────┘
       │ Lista de 20+ productos
       ↓
┌──────────────────────────────┐
│   Usuario selecciona         │
│   productos y cantidades     │
│   (carrito local en JS)      │
└──────┬───────────────────────┘
       │ Resumen: 3 productos + total $275
       │ Selecciona pago: EFECTIVO
       │ Click "Cobrar"
       ↓
┌──────────────────────────────────────────────┐
│  POST /api/ventas                            │
│  {                                           │
│    metodo_pago: "EFECTIVO",                 │
│    items: [                                 │
│      {producto_id: 1, cantidad: 2, ...},   │
│      {producto_id: 5, cantidad: 1, ...}    │
│    ]                                        │
│  }                                          │
└──────┬───────────────────────────────────────┘
       │ Server:
       │ 1. Crear venta en BD
       │ 2. Crear líneas detalle
       │ 3. Decrement stock
       │    - producto 1: 500 → 498
       │    - producto 5: 150 → 149
       ↓
┌──────────────────────────┐
│  Respuesta: 201 Created  │
│  {venta_id: 101, ...}    │
└──────┬───────────────────┘
       │ Confirmación en UI
       │ "Venta registrada!"
       ↓
┌──────────────────────────┐
│  Stock actualizado       │
│  Historial refleja venta │
│  Reports incluyen venta  │
└──────────────────────────┘
```

## Flujo de Datos - Validación de Entrada

```
┌─────────────────────────┐
│  Validar Entradas Page  │
└──────┬──────────────────┘
       │ Input: "EV1-00001"
       │ Click "Buscar"
       ↓
┌──────────────────────────────────┐
│  GET /api/entradas/EV1-00001     │
│  (Buscar entrada por código QR)  │
└──────┬───────────────────────────┘
       │ Respuesta:
       │ {codigo_qr: "EV1-00001",
       │  evento: "Concierto Rock",
       │  cliente: "Cliente 1",
       │  estado: "DISPONIBLE",
       │  ...}
       ↓
┌────────────────────────────┐
│ mostrar detalles entrada   │
│ botón "Validar"            │
└──────┬─────────────────────┘
       │ Click "Validar"
       ↓
┌──────────────────────────────────────────┐
│  PUT /api/entradas/EV1-00001             │
│  Requiere: CONTROL_ENTRADAS              │
│  Acción: UPDATE estado = "VALIDADO"      │
│          UPDATE fecha_validacion = NOW() │
│          UPDATE usuario_validador_id = 3 │
└──────┬───────────────────────────────────┘
       │ Respuesta: 200 OK
       │ {estado: "VALIDADO", fecha_validacion: "..."}
       ↓
┌────────────────────┐
│ Estado visualizado │
│ "VALIDADA"         │
│ Fecha: "15/03/..."│
└────────────────────┘
```

## Autenticación & Autorización

```
┌──────────────────────────────────┐
│   Usuario ingresa credenciales   │
│   email: admin@system...         │
│   password: admin123             │
└──────┬───────────────────────────┘
       │ POST /api/auth/login
       ↓
┌───────────────────────────────────────┐
│  Server (auth.ts):                    │
│                                       │
│  1. SELECT user WHERE email = "..."  │
│  2. bcryptjs.compare(pwd_input,      │
│        pwd_hash_en_db)               │
│     → true ✓                         │
│  3. generateToken(user)              │
│     → JWT válido 24 horas            │
│  4. SET cookie (HttpOnly, Secure)    │
└──────┬────────────────────────────────┘
       │ Response: 200 OK
       │ {user: {id, nombre, rol, ...}}
       │ Cookie: auth_token=<JWT>
       ↓
┌─────────────────────────────────────┐
│  Cliente guarda cookie              │
│  Siguiente request incluye cookie   │
│  GET /api/productos                 │
│  Cookie: auth_token=<JWT>           │
└──────┬──────────────────────────────┘
       │
       ↓ (En servidor, hooks.server.ts)
┌─────────────────────────────────────┐
│  handle() middleware:               │
│                                    │
│  1. Extrae JWT de cookie           │
│  2. verifyToken(jwt)               │
│     → {id: 1, rol: "ADMIN"}        │
│  3. Inyecta en event.locals.user   │
│  4. Continúa request               │
└──────┬──────────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  Endpoint /api/productos:        │
│                                  │
│  if (!locals.user)               │
│    → 401 Unauthorized ✗          │
│                                  │
│  if (locals.user.rol !== ADMIN)  │
│    → 403 Forbidden ✗             │
│                                  │
│  → Procesa request ✓             │
└──────┬───────────────────────────┘
       │ Respuesta con datos
       ↓
┌───────────────────────┐
│  Cliente recibe datos │
│  Página actualiza     │
└───────────────────────┘
```

## Estructura de Directorios

```
e:/boletos/entradas-ya/
│
├── SQL (Base de Datos)
│   ├── schema.sql           [130 líneas - 6 tablas]
│   └── init-data.sql        [150 líneas - datos prueba]
│
├── Scripts Setup
│   ├── SETUP-WINDOWS.ps1    [Setup automático Windows]
│   └── SETUP.sh             [Setup automático Linux/Mac]
│
├── Documentación
│   ├── README.QUICK.md      [5 minutos]
│   ├── README.md            [350+ líneas]
│   ├── SETUP.md             [300+ líneas] 
│   ├── API-REFERENCE.md     [400+ líneas]
│   ├── TESTING.md           [350+ líneas]
│   ├── VERIFICACION.md      [Checklist archivos]
│   ├── RESUMEN-EJECUTIVO.md [Overview completo]
│   ├── INDICE-MAESTRO.md    [Índice de archivos]
│   ├── PROXIMOS-PASOS.md    [Roadmap]
│   └── ARQUITECTURA.md      [Este documento]
│
├── Código (src/)
│   ├── app.d.ts
│   ├── app.html
│   ├── app.css
│   │
│   ├── lib/
│   │   ├── db.js            [Conexión BD]
│   │   ├── auth.ts          [Utilidades auth]
│   │   ├── utils.ts         [Helpers]
│   │   └── components/
│   │       └── Navbar.svelte [Navbar reutilizable]
│   │
│   ├── routes/
│   │   ├── +layout.svelte   [Root layout]
│   │   ├── +page.svelte     [Dashboard]
│   │   ├── layout.css       [Layout styles]
│   │   │
│   │   ├── login/
│   │   │   └── +page.svelte [Login]
│   │   │
│   │   ├── caja/
│   │   │   └── +page.svelte [POS]
│   │   │
│   │   ├── validar/
│   │   │   └── +page.svelte [Entry validation]
│   │   │
│   │   ├── historial/
│   │   │   └── +page.svelte [Sales history]
│   │   │
│   │   ├── reportes-entradas/
│   │   │   └── +page.svelte [Reports]
│   │   │
│   │   ├── productos/
│   │   │   └── +page.svelte [Products CRUD]
│   │   │
│   │   ├── eventos/
│   │   │   └── +page.svelte [Events CRUD]
│   │   │
│   │   ├── usuarios/
│   │   │   └── +page.svelte [Users reference]
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── +server.ts
│   │       │   ├── logout/
│   │       │   │   └── +server.ts
│   │       │   └── me/
│   │       │       └── +server.ts
│   │       │
│   │       ├── productos/
│   │       │   └── +server.ts
│   │       │
│   │       ├── ventas/
│   │       │   └── +server.ts
│   │       │
│   │       ├── eventos/
│   │       │   └── +server.ts
│   │       │
│   │       ├── entradas/
│   │       │   ├── +server.ts
│   │       │   └── [codigo_qr]/
│   │       │       └── +server.ts
│   │       │
│   │       └── reportes/
│   │           └── +server.ts
│   │
│   └── hooks.server.ts      [Global middleware]
│
├── Configuración
│   ├── package.json         [32 dependencias]
│   ├── tsconfig.json        [TypeScript]
│   ├── vite.config.ts       [Vite]
│   ├── svelte.config.js     [SvelteKit]
│   ├── eslint.config.js     [Linting]
│   └── .env.example         [ENV vars]
│
└── Static
    └── robots.txt
```

---

**Resumen:**
- Cliente (SvelteKit UI) ↔ Servidor (Node.js/SvelteKit) ↔ Database (PostgreSQL)
- Autenticación: JWT en cookies HttpOnly
- Autorización: Role-based access control (3 roles)
- APIs: 12+ endpoints RESTful
- Seguridad: bcryptjs + prepared statements + validación
