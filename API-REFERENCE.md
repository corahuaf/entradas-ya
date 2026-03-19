# API REFERENCE

## Authentication

### POST /api/auth/login
Autentica un usuario y devuelve un JWT.

**Request:**
```json
{
  "email": "admin@sistema.local",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "nombre": "Admin",
    "email": "admin@sistema.local",
    "rol": "ADMIN",
    "estado": "ACTIVO"
  }
}
```

**Cookies:**
- `auth_token` (HttpOnly, Secure)

---

### POST /api/auth/logout
Limpia la sesión.

**Response (200):**
```json
{ "success": true }
```

---

### GET /api/auth/me
Devuelve el usuario actualmente autenticado.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "nombre": "Admin",
    "email": "admin@sistema.local",
    "rol": "ADMIN"
  }
}
```

**Response (401):**
```json
{ "error": "No autenticado" }
```

---

## Productos

### GET /api/productos
Lista todos los productos.

**Query Parameters:**
- `estado` (opcional): ACTIVO | INACTIVO

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "Entrada General",
    "precio": "50.00",
    "stock": 500,
    "estado": "ACTIVO"
  }
]
```

---

### POST /api/productos
Crea un nuevo producto. **Requiere: ADMIN**

**Request:**
```json
{
  "nombre": "Producto Nuevo",
  "precio": 25.50,
  "stock": 100
}
```

**Response (201):**
```json
{
  "id": 21,
  "nombre": "Producto Nuevo",
  "precio": "25.50",
  "stock": 100,
  "estado": "ACTIVO"
}
```

---

### PUT /api/productos/[id]
Actualiza un producto. **Requiere: ADMIN**

**Request:**
```json
{
  "nombre": "Nombre actualizado",
  "precio": 30.00,
  "stock": 150,
  "estado": "INACTIVO"
}
```

**Response (200):**
```json
{
  "id": 1,
  "nombre": "Nombre actualizado",
  "precio": "30.00",
  "stock": 150,
  "estado": "INACTIVO"
}
```

---

### DELETE /api/productos/[id]
Elimina un producto. **Requiere: ADMIN**

**Response (200):**
```json
{ "success": true }
```

---

## Ventas

### GET /api/ventas
Lista todas las ventas (con paginación opcional).

**Query Parameters:**
- `limit` (opcional): Default 50
- `offset` (opcional): Default 0

**Response (200):**
```json
{
  "ventas": [
    {
      "id": 1,
      "fecha": "2026-03-15T10:30:00Z",
      "total": "125.50",
      "metodo_pago": "EFECTIVO",
      "usuario_nombre": "Admin",
      "estado": "COMPLETADA",
      "items": [
        {
          "producto": "Entrada General",
          "cantidad": 2,
          "precio": "50.00",
          "subtotal": "100.00"
        }
      ]
    }
  ],
  "total_count": 150
}
```

---

### POST /api/ventas
Registra una nueva venta. **Requiere: CAJERO**

**Request:**
```json
{
  "metodo_pago": "EFECTIVO",
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio": 50.00
    }
  ]
}
```

**Response (201):**
```json
{
  "venta_id": 101,
  "total": "100.00",
  "items_procesados": 1,
  "stock_actualizado": true
}
```

---

## Eventos

### GET /api/eventos
Lista todos los eventos.

**Query Parameters:**
- `estado` (opcional): ACTIVO | INACTIVO

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "Concierto Rock",
    "fecha": "2026-03-22",
    "lugar": "Estadio Principal",
    "estado": "ACTIVO"
  }
]
```

---

### POST /api/eventos
Crea un nuevo evento. **Requiere: ADMIN**

**Request:**
```json
{
  "nombre": "Nuevo Evento",
  "fecha": "2026-04-01",
  "lugar": "Centro de Convenciones"
}
```

**Response (201):**
```json
{
  "id": 6,
  "nombre": "Nuevo Evento",
  "fecha": "2026-04-01",
  "lugar": "Centro de Convenciones",
  "estado": "ACTIVO"
}
```

---

## Entradas

### GET /api/entradas
Lista todas las entradas.

**Query Parameters:**
- `evento_id` (opcional): Filtrar por evento
- `estado` (opcional): DISPONIBLE | VALIDADO | ANULADO
- `limit` (opcional): Default 50
- `offset` (opcional): Default 0

**Response (200):**
```json
{
  "entradas": [
    {
      "id": 1,
      "codigo_qr": "EV1-00001",
      "evento": "Concierto Rock",
      "nombre_cliente": "Cliente 1",
      "estado": "DISPONIBLE",
      "fecha_compra": "2026-03-15T10:00:00Z",
      "fecha_validacion": null
    }
  ],
  "total_count": 500
}
```

---

### POST /api/entradas
Crea nuevas entradas para un evento. **Requiere: ADMIN**

**Request:**
```json
{
  "evento_id": 1,
  "cantidad": 10,
  "nombre_cliente_base": "Cliente"
}
```

**Response (201):**
```json
{
  "cantidad_creada": 10,
  "entradas": [
    {
      "codigo_qr": "EV1-00001",
      "nombre_cliente": "Cliente 1"
    }
  ]
}
```

---

### GET /api/entradas/[codigo_qr]
Obtiene la información de una entrada específica.

**Response (200):**
```json
{
  "id": 1,
  "codigo_qr": "EV1-00001",
  "evento": "Concierto Rock",
  "nombre_cliente": "Cliente 1",
  "estado": "DISPONIBLE",
  "fecha_compra": "2026-03-15T10:00:00Z"
}
```

**Response (404):**
```json
{ "error": "Entrada no encontrada" }
```

---

### PUT /api/entradas/[codigo_qr]
Valida una entrada (marca como VALIDADO). **Requiere: CONTROL_ENTRADAS**

**Response (200):**
```json
{
  "id": 1,
  "codigo_qr": "EV1-00001",
  "estado": "VALIDADO",
  "fecha_validacion": "2026-03-15T15:30:00Z",
  "usuario_validador": "María García"
}
```

**Response (400):**
```json
{ "error": "Esta entrada ya fue validada" }
```

---

## Reportes

### GET /api/reportes?tipo=[tipo]
Obtiene reportes según el tipo.

**Tipos disponibles:**

#### ventas-dia
Ventas del día actual con agregados.

**Response (200):**
```json
{
  "fecha": "2026-03-15",
  "total_ventas": 5,
  "monto_total": "2500.50",
  "metodos_pago": {
    "EFECTIVO": "1500.00",
    "TARJETA": "1000.50"
  },
  "ventas": [...]
}
```

#### entradas-validadas
Entradas validadas (con estado VALIDADO).

**Response (200):**
```json
{
  "total_validadas": 45,
  "por_evento": [
    {
      "evento": "Concierto Rock",
      "validadas": 30
    }
  ]
}
```

#### entradas-disponibles
Entradas aún disponibles (sin validar).

**Response (200):**
```json
{
  "total_disponibles": 455,
  "por_evento": [
    {
      "evento": "Concierto Rock",
      "disponibles": 470
    }
  ]
}
```

#### productos-vendidos
Productos más vendidos.

**Response (200):**
```json
{
  "periodo": "2026-03-15",
  "productos": [
    {
      "nombre": "Entrada General",
      "cantidad_vendida": 50,
      "monto_vendido": "2500.00"
    }
  ]
}
```

---

## Códigos de Respuesta HTTP

```
200 OK              - Éxito
201 Created         - Recurso creado
400 Bad Request     - Error de validación
401 Unauthorized    - No autenticado
403 Forbidden       - Permiso denegado
404 Not Found       - Recurso no encontrado
500 Server Error    - Error del servidor
```

---

## Autenticación en Requests

Todas las rutas (excepto POST /api/auth/login) requieren autenticación.

El token se envía automáticamente por cookie, pero si lo necesitas manualmente:

```bash
curl -X GET http://localhost:5173/api/productos \
  -H "Cookie: auth_token=<JWT_TOKEN>"
```

---

## Roles Requeridos

```
ADMIN              - Todas las operaciones
CAJERO             - Ventas, historial, reportes
CONTROL_ENTRADAS   - Ver y validar entradas
```

---

## Ejemplos con curl

### Login
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.local","password":"admin123"}'
```

### Crear Producto (ADMIN)
```bash
curl -X POST http://localhost:5173/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nuevo","precio":25.50,"stock":100}' \
  --cookie "auth_token=<TOKEN>"
```

### Registrar Venta (CAJERO)
```bash
curl -X POST http://localhost:5173/api/ventas \
  -H "Content-Type: application/json" \
  -d '{"metodo_pago":"EFECTIVO","items":[{"producto_id":1,"cantidad":2,"precio":50}]}' \
  --cookie "auth_token=<TOKEN>"
```

### Validar Entrada (CONTROL_ENTRADAS)
```bash
curl -X PUT http://localhost:5173/api/entradas/EV1-00001 \
  --cookie "auth_token=<TOKEN>"
```

### Obtener Reportes
```bash
curl http://localhost:5173/api/reportes?tipo=ventas-dia \
  --cookie "auth_token=<TOKEN>"
```
