# 🎫 Sistema de Caja y Validación de Entradas

Un sistema web moderno optimizado para tablet que integra gestión de ventas (POS) y validación de entradas para eventos.

## 🎯 Características Principales

### 1. **Autenticación Multi-Rol**
- Sistema de login seguro con JWT
- 3 roles: ADMIN, CAJERO, CONTROL_ENTRADAS
- Protección de rutas según permisos

### 2. **Módulo CAJA (POS)**
- Interfaz intuitiva para venta de productos
- Carrito dinámico con ajuste de cantidades
- 4 métodos de pago: EFECTIVO, YAPE, PLIN, TARJETA
- Descuento automático de stock
- Historial de ventas

### 3. **Módulo EVENTOS**
- Creación y gestión de eventos
- Asociación de entradas a eventos
- Información detallada de asistentes

### 4. **Módulo ENTRADAS**
- Generación de códigos QR únicos
- Búsqueda por código manual o escaneo
- Validación de entradas en tiempo real
- Estados: DISPONIBLE, VALIDADO, ANULADO
- Historial de validaciones

### 5. **DASHBOARD**
- Acceso rápido a módulos principales
- Interfaz optimizada para tablet con botones grandes
- Menú dinámico según rol del usuario

### 6. **REPORTES**
- Ventas del día por usuario y método de pago
- Productos más vendidos
- Entradas validadas por evento
- Entradas disponibles

## 📋 Requisitos Previos

- Node.js 18+ con npm
- PostgreSQL (o Neon Database)
- Git

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPO>
cd entradas-ya
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

**Editar `.env.local`:**
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
```

### 4. Ejecutar migraciones SQL
```bash
# Ejecutar schema.sql en tu base de datos
psql -U usuario -d base_datos -f schema.sql
```

O importar el `schema.sql` desde tu cliente PostgreSQL.

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

El sistema estará disponible en: **http://localhost:5173**

### 6. Para producción
```bash
npm run build
npm run preview
```

## 🔐 Credenciales de Demo

Después de ejecutar el schema, tendrás:

- **Email:** admin@sistema.local
- **Rol:** ADMIN
- **Contraseña:** Debes actualizar el hash en la BD

Para crear el hash de una contraseña, usa bcryptjs:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('tucontraseña', 10);
console.log(hash);
```

Luego actualiza la tabla:
```sql
UPDATE usuarios 
SET password = '[hash-generado]' 
WHERE email = 'admin@sistema.local';
```

## 📁 Estructura del Proyecto

```
src/
├── routes/
│   ├── +layout.svelte           # Layout principal
│   ├── +page.svelte             # Dashboard
│   ├── login/+page.svelte       # Página de login
│   ├── caja/+page.svelte        # Sistema POS
│   ├── validar/+page.svelte     # Validación de entradas
│   ├── historial/+page.svelte   # Historial de ventas
│   ├── reportes-entradas/       # Reportes
│   ├── productos/+page.svelte   # Gestión productos
│   ├── eventos/+page.svelte     # Gestión eventos
│   ├── usuarios/+page.svelte    # Gestión usuarios
│   └── api/
│       ├── auth/               # Endpoints autenticación
│       ├── productos/          # CRUD productos
│       ├── ventas/             # Registro de ventas
│       ├── entradas/           # CRUD entradas
│       ├── eventos/            # CRUD eventos
│       └── reportes/           # Generación de reportes
├── lib/
│   ├── auth.ts                 # Utilidades de autenticación
│   ├── db.js                   # Conexión a BD
│   └── components/
│       └── Navbar.svelte       # Barra de navegación
├── hooks.server.ts             # Middleware global
└── app.css                     # Estilos globales

schema.sql                       # Definición de BD
```

## 🔄 Flujos Principales

### Login
1. Usuario accede a `/login`
2. Ingresa email y contraseña
3. Sistema valida y genera JWT
4. Token se almacena en cookie segura
5. Redirige al dashboard

### Venta de Productos
1. Cajero accede a `/caja`
2. Selecciona productos
3. Ajusta cantidades
4. Selecciona método de pago
5. Procesa venta
6. Sistema descuenta stock automáticamente

### Validación de Entradas
1. Control de acceso accede a `/validar`
2. Escanea o busca código QR
3. Sistema muestra información de entrada
4. Valida entrada
5. Registra fecha/hora de validación

## 🛠️ Tecnologías Utilizadas

- **Frontend:** SvelteKit, Svelte 5
- **Styling:** CSS3 (responsive)
- **Backend:** SvelteKit Endpoints, Node.js
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT + bcryptjs
- **QR Scanner:** html5-qrcode
- **QR Generator:** qrcode
- **Build Tool:** Vite

## 📱 Optimización para Tablet

- Interfaz responsiva con CSS Grid y Flexbox
- Botones grandes (mínimo 48px)
- Tipografía legible
- Media queries para pantallas 768px y 480px
- Touch-friendly controls

## 🔐 Seguridad

- Contraseñas hasheadas con bcryptjs (10 salts)
- JWT con expiración de 24 horas
- Cookies HttpOnly para tokens
- Middleware de protección de rutas
- Validación de roles en endpoints
- SQL prepared statements con Neon

## 📊 Endpoints API

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Obtener usuario actual

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar
- `DELETE /api/productos/:id` - Desactivar

### Ventas
- `POST /api/ventas` - Registrar venta
- `GET /api/ventas` - Listar ventas

### Eventos
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Crear evento

### Entradas
- `GET /api/entradas` - Listar entradas
- `POST /api/entradas` - Crear entrada
- `GET /api/entradas/:codigo_qr` - Buscar entrada
- `PUT /api/entradas/:codigo_qr` - Validar entrada

### Reportes
- `GET /api/reportes?tipo=ventas-dia` - Ventas del día
- `GET /api/reportes?tipo=entradas-validadas` - Entradas validadas
- `GET /api/reportes?tipo=productos-vendidos` - Productos vendidos

## 🐛 Troubleshooting

### Error de conexión a BD
- Verificar `DATABASE_URL` en `.env.local`
- Asegurar que la BD está corriendo
- Ejecutar `schema.sql`

### Token expirado
- Hacer login nuevamente
- Token se renova automáticamente

### Stock no se actualiza
- Verificar que los productos existen
- Revisar permisos de usuario

## 📝 Notas de Desarrollo

- El token JWT expira en 24 horas
- Las contraseñas deben tener mínimo 8 caracteres
- Los códigos QR se generan con formato: `{EVENTO_ID}-{ENTRADA_ID}`
- Las ventas se registran con timestamp automático

## 📄 Licencia

MIT

## 👥 Soporte

Para reportar bugs o sugerencias, crear un issue en el repositorio.

---

**Versión:** 1.0.0  
**Última actualización:** Marzo 2026

1. **Clonar y instalar dependencias**:

```bash
cd mi-sistema-entradas
npm install
```

2. **Configurar variables de entorno**:

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# DATABASE_URL=postgresql://user:password@host/database
```

3. **Iniciar servidor de desarrollo**:

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

## Scripts Disponibles

| Comando           | Descripción                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Inicia servidor de desarrollo      |
| `npm run build`   | Compila para producción            |
| `npm run preview` | Previsualiza build de producción   |
| `npm run check`   | Verifica tipos TypeScript y Svelte |
| `npm run lint`    | Ejecuta ESLint y Prettier          |
| `npm run format`  | Formatea código con Prettier       |

## Estructura del Proyecto

```
src/
├── routes/
│   ├── +page.svelte          # Página principal
│   ├── +layout.svelte        # Layout global
│   ├── admin/                # Página de estadísticas
│   ├── validar/              # Validación de QR
│   ├── ventas/               # Gestión de ventas
│   └── api/                  # Endpoints REST
│       ├── validar/+server.ts
│       └── bebidas/+server.ts
├── lib/
│   ├── components/           # Componentes Svelte
│   ├── db.ts                 # Conexión a BD
│   └── utils.ts              # Funciones auxiliares
└── app.css                   # Estilos globales
```

## Componentes Principales

### Scanner

Componente que captura y decodifica códigos QR usando `html5-qrcode`.

### StatsCard

Tarjeta reutilizable para mostrar estadísticas.

### Navbar

Barra de navegación principal del sitio.

## API Endpoints

### POST `/api/validar`

Valida una entrada por su código QR.

**Payload:**

```json
{ "qr_id": "id_entrada" }
```

**Respuesta:**

```json
{
	"success": true,
	"message": "Bienvenido/a Nombre"
}
```

### POST `/api/bebidas`

Registra una venta de bebida.

**Payload:**

```json
{
	"entrada_id": "id_entrada",
	"producto": "Cerveza",
	"precio": 10.0
}
```

## Base de Datos

El proyecto requiere las siguientes tablas en PostgreSQL:

```sql
CREATE TABLE entradas (
  id PRIMARY KEY,
  nombre_asistente VARCHAR(255),
  validada BOOLEAN DEFAULT false,
  fecha_validacion TIMESTAMP
);

CREATE TABLE ventas_bebidas (
  id SERIAL PRIMARY KEY,
  entrada_id VARCHAR(255),
  producto VARCHAR(255),
  precio DECIMAL(10, 2),
  fecha TIMESTAMP DEFAULT NOW()
);
```

## Mejoras Realizadas

✔️ Agregada dependencia `html5-qrcode`  
✔️ Creado archivo `app.css` para estilos globales  
✔️ Convertidos archivos a TypeScript (.ts)  
✔️ Añadido validación de tipos en todas las rutas  
✔️ Mejorado componente de ventas con tabla y formulario  
✔️ Agregado manejo de errores mejorado  
✔️ Creado archivo `.env.example` con variables requeridas

## Configuración de Desarrollo

Este proyecto usa:

- **Svelte 5**: Framework reactivo
- **SvelteKit**: Meta-framework full-stack
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Utilidades CSS
- **Neon**: PostgreSQL sin servidor
- **Vite**: Bundler moderno

## Despliegue

El proyecto está pre-configurado para desplegar en **Vercel**:

```bash
npm run build
# Los archivos build/ están listos para Vercel
```

## Troubleshooting

### Error: Cannot find module 'html5-qrcode'

```bash
npm install
```

### Error de conexión a BD

Verifica que `DATABASE_URL` esté correctamente configurada en `.env`

### Errores de TypeScript

```bash
npm run check
```

## Licencia

MIT

## Contacto

Para preguntas o soporte, abre un issue en el repositorio.
