# Sistema de Gestión de Entradas y Ventas

Un sistema web completo para gestionar la validación de entradas en eventos y registrar ventas de bebidas/artículos, construido con **SvelteKit**, **TypeScript**, **Tailwind CSS** y **Neon PostgreSQL**.

## Características

✅ **Control de Acceso**: Sistema de escaneo QR para validar entradas  
✅ **Gestión de Ventas**: Registro de ventas de bebidas/artículos  
✅ **Dashboard**: Visualización de estadísticas en tiempo real  
✅ **Panel Administrativo**: Resumen de asistentes y recaudación  
✅ **API RESTful**: Endpoints para integración con otras aplicaciones

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en [Neon](https://neon.tech) para la base de datos PostgreSQL
- Variables de entorno configuradas

## Instalación

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
