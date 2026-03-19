# TESTING GUIDE

## Testing Manual (Navegador)

### 1. Login
1. Abre http://localhost:5173/login
2. Ingresa:
   - Email: `admin@sistema.local`
   - Password: `admin123`
3. Presiona "Ingresar" o Enter
4. Deberías ver el Dashboard

### 2. Dashboard (ADMIN)
- Veras 6 botones: CAJA, VALIDAR ENTRADAS, PRODUCTOS, EVENTOS, USUARIOS, REPORTES
- Cada botón navega a su módulo

### 3. CAJA (POS System)
1. Click en "CAJA" desde Dashboard
2. Deberías ver:
   - Lista de productos (izquierda)
   - Carrito vacío (derecha)
3. Click en cualquier producto para agregarlo al carrito
4. Usa "+/-" para cambiar cantidad
5. Selecciona método de pago: EFECTIVO, YAPE, PLIN, TARJETA
6. Click "Cobrar" para registrar la venta
7. Deberías ver confirmación "Venta registrada"

**Verificación del stock:**
- Vuelve a productos
- El stock debería haber bajado en 1

### 4. VALIDAR ENTRADAS
1. Click en "VALIDAR ENTRADAS"
2. Deberías ver un input para "Código QR"
3. Ingresa un código: `EV1-00001` (del init-data.sql)
4. Click "BUSCAR"
5. Deberías ver los detalles de la entrada
6. Click "VALIDAR"
7. El estado debería cambiar a "VALIDADO"

### 5. PRODUCTOS
1. Click en "PRODUCTOS"
2. Deberías ver tabla de 20 productos
3. Ingresa un nuevo producto:
   - Nombre: `Entrada Premium`
   - Precio: `150`
   - Stock: `50`
4. Click "Agregar"
5. El producto aparecerá en la tabla

### 6. EVENTOS
1. Click en "EVENTOS"
2. Deberías ver 5 eventos en cards
3. Ingresa un nuevo evento:
   - Nombre: `Mi Evento`
   - Fecha: `2026-04-15`
   - Lugar: `Mi Lugar`
4. Click "Crear Evento"
5. El evento aparecerá en el grid

### 7. HISTORIAL
1. Click en "HISTORIAL"
2. Deberías ver stats: "Total Ventas", "Monto Total"
3. Deberías ver tabla con transacciones previas
4. Cada fila muestra: Fecha, Usuario, Total, Método, Estado

### 8. REPORTES
1. Click en "REPORTES"
2. Deberías ver 4 tabs:
   - Ventas Hoy
   - Entradas Validadas
   - Entradas Disponibles
   - Productos Vendidos
3. Click en cada tab para ver los datos

### 9. Logout
1. Click en el nombre de usuario (arriba derecha)
2. Click "Salir"
3. Deberías volver a login

---

## Testing con curl

### 1. Login y Obtener Token
```bash
curl -c cookies.txt -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.local","password":"admin123"}'
```

Respuesta esperada:
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

### 2. Ver Usuario Actual
```bash
curl -b cookies.txt http://localhost:5173/api/auth/me
```

### 3. Listar Productos
```bash
curl -b cookies.txt http://localhost:5173/api/productos
```

### 4. Crear Producto (ADMIN)
```bash
curl -b cookies.txt -X POST http://localhost:5173/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Entrada Premium",
    "precio": 150,
    "stock": 50
  }'
```

### 5. Registrar Venta (CAJERO)

Primero cambiar a usuario CAJERO:
```bash
curl -c cookies.txt -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@sistema.local","password":"admin123"}'
```

Luego registrar venta:
```bash
curl -b cookies.txt -X POST http://localhost:5173/api/ventas \
  -H "Content-Type: application/json" \
  -d '{
    "metodo_pago": "EFECTIVO",
    "items": [
      {
        "producto_id": 1,
        "cantidad": 3,
        "precio": 50.00
      },
      {
        "producto_id": 2,
        "cantidad": 2,
        "precio": 8.00
      }
    ]
  }'
```

### 6. Listar Entradas
```bash
curl -b cookies.txt http://localhost:5173/api/entradas
```

### 7. Validar Entrada (CONTROL_ENTRADAS)

Cambiar a usuario CONTROL_ENTRADAS:
```bash
curl -c cookies.txt -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@sistema.local","password":"admin123"}'
```

Validar entrada:
```bash
curl -b cookies.txt -X PUT http://localhost:5173/api/entradas/EV1-00001
```

### 8. Obtener Reportes
```bash
curl -b cookies.txt 'http://localhost:5173/api/reportes?tipo=ventas-dia'
curl -b cookies.txt 'http://localhost:5173/api/reportes?tipo=entradas-validadas'
curl -b cookies.txt 'http://localhost:5173/api/reportes?tipo=productos-vendidos'
```

### 9. Logout
```bash
curl -b cookies.txt -X POST http://localhost:5173/api/auth/logout
```

---

## Testing Automatizado (Próxima Fase)

Script de testing completo (bash):

```bash
#!/bin/bash

BASE_URL="http://localhost:5173"
COOKIES="cookies.txt"

echo "1. Login como ADMIN..."
curl -s -c "$COOKIES" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.local","password":"admin123"}' | jq .

echo ""
echo "2. Crear Producto..."
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/productos" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Producto","precio":99.99,"stock":100}' | jq .

echo ""
echo "3. Listar Productos..."
curl -s -b "$COOKIES" "$BASE_URL/api/productos" | jq .

echo ""
echo "4. Listar Eventos..."
curl -s -b "$COOKIES" "$BASE_URL/api/eventos" | jq .

echo ""
echo "5. Listar Entradas..."
curl -s -b "$COOKIES" "$BASE_URL/api/entradas?limit=5" | jq .

echo ""
echo "6. Cambiar a CAJERO y registrar venta..."
curl -s -c "$COOKIES" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@sistema.local","password":"admin123"}' > /dev/null

curl -s -b "$COOKIES" -X POST "$BASE_URL/api/ventas" \
  -H "Content-Type: application/json" \
  -d '{
    "metodo_pago":"EFECTIVO",
    "items":[{"producto_id":1,"cantidad":2,"precio":50}]
  }' | jq .

echo ""
echo "7. Ver reportes..."
curl -s -b "$COOKIES" "$BASE_URL/api/reportes?tipo=ventas-dia" | jq .

echo ""
echo "✓ Testing completado"
rm "$COOKIES"
```

---

## Checklist de Testing

### Autenticación
- [ ] Login con admin funciona
- [ ] Login con credenciales incorrectas falla
- [ ] Logout limpia sesión
- [ ] Rutas no autenticadas redirigen a login
- [ ] JWT expira después de 24 horas

### POS (CAJA)
- [ ] Productos se cargan correctamente
- [ ] Se puede agregar producto al carrito
- [ ] Cantidad se puede incrementar/decrementar
- [ ] Subtotal se calcula correctamente
- [ ] Se puede seleccionar método de pago
- [ ] Total se calcula sumando subtotales
- [ ] Registrar venta actualiza stock
- [ ] Historial muestra nueva venta

### Entradas
- [ ] Se pueden crear entradas para un evento
- [ ] Código QR se genera único
- [ ] Se puede buscar entrada por código
- [ ] Se puede validar una entrada disponible
- [ ] No se puede validar dos veces la misma entrada
- [ ] Reporte de validadas cuenta correcto
- [ ] Reporte de disponibles cuenta correcto

### Productos
- [ ] Se pueden crear nuevos productos
- [ ] Se pueden actualizar productos existentes
- [ ] Stock no puede ser negativo
- [ ] Productos inactivos no aparecen en POS

### Eventos
- [ ] Se pueden crear eventos
- [ ] Se pueden actualizar eventos
- [ ] Fecha debe ser válida
- [ ] Lugar es requerido

### Reportes
- [ ] Reporte de ventas hoy es exacto
- [ ] Reporte de entradas validadas es exacto
- [ ] Reporte de entradas disponibles es exacto
- [ ] Reporte de productos vendidos es exacto

### Seguridad
- [ ] Solo ADMIN puede crear/editar productos
- [ ] Solo CAJERO puede registrar ventas
- [ ] Solo CONTROL_ENTRADAS puede validar entradas
- [ ] Contraseñas están hasheadas en DB
- [ ] JWT no expone información sensible

---

## Debugging

### Ver logs en desarrollo
```bash
npm run dev
# Los logs aparecen en la terminal donde corres npm run dev
```

### Acceder a la base de datos
```bash
psql -U postgres -d caja_entradas
```

Comandos útiles en psql:
```sql
-- Ver usuarios
SELECT id, nombre, email, rol, estado FROM usuarios;

-- Ver últimas ventas
SELECT id, fecha, total, metodo_pago FROM ventas ORDER BY fecha DESC LIMIT 10;

-- Ver stock de productos
SELECT id, nombre, precio, stock FROM productos;

-- Ver entradas validadas
SELECT COUNT(*) FROM entradas WHERE estado = 'VALIDADO';

-- Ver entradas disponibles
SELECT COUNT(*) FROM entradas WHERE estado = 'DISPONIBLE';
```

### Common Issues

**"TypeError: Cannot read property 'user' of undefined"**
- JWT no se está validando correctamente
- Verifica que JWT_SECRET en .env.local sea el mismo usado en schema.sql

**"Produto no aparece en CAJA"**
- El stock debe ser > 0
- El estado debe ser 'ACTIVO'

**"Entrada no se encuentra"**
- Verifica que init-data.sql fue ejecutado
- Verifica el código QR exactamente: `EV1-00001`

**"Error connecting to database"**
- Revisa DATABASE_URL en .env.local
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales
