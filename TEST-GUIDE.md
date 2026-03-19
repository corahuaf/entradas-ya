# Guía de Testing - Sistema POS + Entradas

## 🎯 Checklist de Verificación Rápida

### 1. Setup Inicial (5 min)
- [ ] PostgreSQL corriendo (local o Neon)
- [ ] `schema.sql` ejecutado (6 tablas creadas)
- [ ] `init-data.sql` ejecutado (datos de prueba listos)
- [ ] `.env.local` con DATABASE_URL y JWT_SECRET
- [ ] `npm install` completado
- [ ] `npm run dev` sin errores

### 2. Login (1 min)
```
URL: http://localhost:5173/login
Email: admin@sistema.local
Password: admin123
✅ Debe redirigir a /dashboard con welcome message
```

### 3. Dashboard (2 min)
```
✅ Ver nombre y rol en Navbar (admin)
✅ Ver 6-9 botones según rol (ADMIN ve TODOS)
✅ Cada botón debe ser clickeable sin errores
```

### 4. Módulo CAJA (5 min)
```
1. Ir a Menu → CAJA (o click botón CAJA)
2. ✅ Ver lista de productos izquierda
3. ✅ Búsqueda funciona (escribir "agua" → filtra)
4. ✅ Click en producto → aparece en carrito derecha
5. ✅ Modificar cantidad en carrito (+ / -)
6. ✅ Subtotal calcula correcto: cantidad × precio
7. ✅ Total suma todos los items
8. ✅ Seleccionar método pago (EFECTIVO/YAPE/PLIN/TARJETA)
9. ✅ Click "COBRAR" → sale registrada (check stock decrementó)
10. ✅ Carrito se vacía, nuevo cálculo
```

**Validar Stock:**
```sql
-- Antes de compra
SELECT nombre, stock FROM productos WHERE nombre = 'Agua (500ml)';
-- Comprar 5 unidades
-- Después
SELECT nombre, stock FROM productos WHERE nombre = 'Agua (500ml)';
-- Debe mostrar -5 del valor inicial
```

### 5. Módulo VALIDAR ENTRADAS (5 min)
```
1. Ir a Menu → VALIDAR ENTRADAS
2. ✅ Ver input "Código QR" vacío
3. ✅ Ingresar código: EV1-00001
4. ✅ Click "BUSCAR" → muestra tarjeta con datos:
   - Código QR
   - Evento
   - Nombre cliente
   - Estado (DISPONIBLE/VALIDADO/ANULADO)
5. ✅ Botón "VALIDAR" solo activo si estado=DISPONIBLE
6. ✅ Click "VALIDAR" → estado cambia a VALIDADO
7. ✅ Fecha validación se llena con CURRENT_TIMESTAMP
8. ✅ Usuario validador registra ID actual
9. ✅ Click "NUEVA BÚSQUEDA" limpia form + carrito
10. ✅ Buscar entrada YA VALIDADA → botón VALIDAR deshabilitado (gris)
```

**Validar DB:**
```sql
-- Antes
SELECT codigo_qr, estado, fecha_validacion FROM entradas WHERE codigo_qr = 'EV1-00001';
-- Validar desde UI
-- Después (fecha_validacion debe tener timestamp)
SELECT estado, fecha_validacion, usuario_validador_id FROM entradas WHERE codigo_qr = 'EV1-00001';
```

### 6. Módulo HISTORIAL (2 min)
```
1. Ir a Menu → HISTORIAL DE VENTAS
2. ✅ Cards superiores muestren:
   - Total Ventas (suma de todos los totales)
   - Monto Total (debe coincidir con query)
3. ✅ Tabla muestre transacciones:
   - Fecha (timestamp)
   - Usuario (nombre del cajero)
   - Total (con 2 decimales)
   - Método Pago (EFECTIVO/YAPE/etc)
   - Estado (COMPLETADA)
4. ✅ Si agregaste 1 entrada en CAJA, debe aparecer aquí
```

### 7. Módulo REPORTES (2 min)
```
1. Ir a Menu → REPORTES - ENTRADAS
2. ✅ Ver 4 tabs: 
   - Ventas del Día
   - Entradas Validadas
   - Entradas Disponibles
   - Productos Vendidos
3. ✅ Datos coincidan con BD
4. ✅ Cards muestren números correctos
```

### 8. Módulo PRODUCTOS (3 min)
```
1. Ir a Menu → PRODUCTOS
2. ✅ Formulario superior (Agregar Producto):
   - Campo Nombre
   - Campo Precio (number)
   - Campo Stock (number)
   - Botón AGREGAR
3. ✅ Ingresar: Nombre="Test", Precio=99.99, Stock=10
4. ✅ Click AGREGAR → lista se actualiza abajo
5. ✅ Buscar "Test" en tabla → producto aparece
6. ✅ Stock muy bajo (<5) → fondo rojo (visual warning)
7. ✅ Producto nuevo aparece en CAJA también (no reload)
```

### 9. Módulo EVENTOS (3 min)
```
1. Ir a Menu → EVENTOS
2. ✅ Formulario superior:
   - Nombre
   - Fecha (date input)
   - Lugar
   - Botón CREAR EVENTO
3. ✅ Ingresar: Nombre="Test Event", Fecha=2025-02-15, Lugar="Hall"
4. ✅ Click CREAR → cards abajo se actualizan
5. ✅ Cards muestren fecha formateada + lugar + estado
6. ✅ Evento nuevo disponible en VALIDAR (dropdown evento)
```

### 10. Logout (1 min)
```
1. Click botón LOGOUT en Navbar (arriba derecha)
2. ✅ Redirige a /login
3. ✅ Cookie auth_token se elimina
4. ✅ Intentar acceder /dashboard manualmente → redirige a login
```

### 11. Multi-Rol Testing (5 min)

**Test como CAJERO:**
```
Email: juan@sistema.local
Password: admin123
✅ Dashboard muestra SOLO botones: CAJA, VALIDAR, HISTORIAL, REPORTES
✅ NO ve: PRODUCTOS, EVENTOS, USUARIOS (ocultos/404)
✅ CAJA funciona completamente
✅ Historial muestra ventas de ESTE usuario + otros
```

**Test como CONTROL_ENTRADAS:**
```
Email: maria@sistema.local  
Password: admin123
✅ Dashboard muestra SOLO: VALIDAR ENTRADAS, HISTORIAL, REPORTES
✅ NO ve: CAJA, PRODUCTOS, EVENTOS, USUARIOS
✅ VALIDAR ENTRADAS funciona completamente
✅ NO puede crear productos ni eventos
```

### 12. Error Handling (3 min)
```
Test casos erróneos:

CAJA:
- [ ] Cobrar carrito vacío → error "Añade productos primero"
- [ ] Búsqueda sin resultados → "No hay productos"

VALIDAR:
- [ ] Código inválido → tarjeta roja "Entrada no encontrada"
- [ ] Código ANULADO → botón validar gris
- [ ] Campo vacío + buscar → "Ingresa código QR"

LOGIN:
- [ ] Email incorrecto → "Credenciales inválidas"
- [ ] Password incorrecta → "Credenciales inválidas"
- [ ] Campo vacío → "Completa todos los campos"
```

## 🔧 Debugging Rápido

### Errores comunes:

**"Cannot connect to database"**
```
✓ DATABASE_URL en .env.local
✓ PostgreSQL service corriendo
✓ Credenciales correctas (usuario/pass)
✓ Base de datos 'caja_entradas' existe
```

**"Token inválido / No autorizado"**
```
✓ JWT_SECRET en .env.local
✓ Cookie auth_token aún válido (no expiró)
✓ Middleware hooks.server.ts se ejecuta
```

**"Producto no aparece en CAJA"**
```
✓ Estado = 'ACTIVO' en tabla
✓ Stock > 0
✓ Reload página si agregaste producto recientemente
```

**"Entrada no se valida"**
```
✓ código_qr existe exacto (case-sensitive)
✓ estado = 'DISPONIBLE' (no VALIDADA ni ANULADA)
✓ evento_id válido
```

## 📊 Validación Final

**Queries de sanidad check:**

```sql
-- Usuarios creados
SELECT COUNT(*), COUNT(DISTINCT rol) FROM usuarios;
-- Debe retornar: 3 | 3

-- Productos con stock
SELECT COUNT(*) FROM productos WHERE estado='ACTIVO' AND stock > 0;
-- Debe retornar: ~20+

-- Eventos activos
SELECT COUNT(*) FROM eventos WHERE estado='ACTIVO';
-- Debe retornar: 5

-- Entradas sin validar
SELECT COUNT(*) FROM entradas WHERE estado='DISPONIBLE';
-- Debe retornar: ~15+ (algunas ya validadas en tests)

-- Ventas registradas
SELECT COUNT(*) FROM ventas;
-- Debe crecer cada vez que cobras en CAJA
```

## ⏱️ Tiempo total estimado: 30-45 minutos

✅ Todos los tests pasan = Sistema listo para producción

## 🚀 Next Steps (Deferred)

- [ ] Escanear QR real con cámara (html5-qrcode)
- [ ] API para crear usuarios (POST /api/usuarios)
- [ ] Exportar reportes a PDF
- [ ] Notificaciones por email
- [ ] Sync multi-dispositivo en tiempo real
