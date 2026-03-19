# PRÓXIMOS PASOS

## 🎯 Hoy: Setup y Primeras Pruebas (30 minutos)

### Paso 1: Ejecutar Setup (5 min)

**Windows:**
```powershell
cd e:\boletos\entradas-ya
.\SETUP-WINDOWS.ps1
```

**Linux/Mac:**
```bash
cd ~/entradas-ya
chmod +x SETUP.sh
./SETUP.sh
```

El script automáticamente:
- ✓ Verifica Node.js y PostgreSQL
- ✓ Crea database
- ✓ Ejecuta schema.sql
- ✓ Carga datos de prueba
- ✓ Genera .env.local
- ✓ Instala npm dependencies

### Paso 2: Iniciar Servidor (2 min)

```bash
npm run dev
```

Deberías ver:
```
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Paso 3: Primera Sesión de Testing (10 min)

**En navegador:**

1. Abre http://localhost:5173/login
2. Login: `admin@sistema.local` / `admin123`
3. Verifica Dashboard (deberías ver 6 botones)

**Prueba cada módulo:**
- ✓ Click en CAJA (POS)
  - Busca un producto
  - Agrega al carrito
  - Selecciona método pago
  - Click "Cobrar"
  - Deberías ver "Venta registrada"

- ✓ Click en VALIDAR ENTRADAS
  - Input: `EV1-00001` (código de entrada)
  - Click "BUSCAR"
  - Click "VALIDAR"
  - Estado debería cambiar a "VALIDADO"

- ✓ Click en PRODUCTOS
  - Deberías ver tabla con 20 productos
  - Prueba agregar uno nuevo

- ✓ Click en HISTORIAL
  - Deberías ver las ventas que registraste

- ✓ Logout
  - Click en tu nombre arriba derecha
  - Click "Salir"

### Paso 4: Verificar Integración (10 min)

**En terminal (otra ventana):**

```bash
cd e:\boletos\entradas-ya

# Conectar a database
psql -U postgres -d caja_entradas

# Dentro de psql, verifica:
SELECT COUNT(*) FROM usuarios;        -- Debería ser 3
SELECT COUNT(*) FROM productos;       -- Debería ser 20
SELECT COUNT(*) FROM eventos;         -- Debería ser 5
SELECT COUNT(*) FROM entradas;        -- Debería ser 400+
SELECT COUNT(*) FROM ventas;          -- Debería tener tu venta nueva

# Salir
\q
```

---

## 📅 Esta Semana: Expansión de Datos

### Opción A: Agregar Más Datos vía UI
1. Abre Dashboard
2. Click PRODUCTOS → Agrega 10 más
3. Click EVENTOS → Crea 3 eventos nuevos
4. Desde CAJA → Registra 20 ventas

### Opción B: Scripts SQL Personalizados

Crear `seed-more-data.sql`:
```sql
-- Agregar 50 productos más
INSERT INTO productos (nombre, precio, stock, estado) VALUES
('Producto A', 10.00, 100, 'ACTIVO'),
('Producto B', 20.00, 150, 'ACTIVO'),
-- ... etc
;

-- Agregar eventos
INSERT INTO eventos (nombre, fecha, lugar, estado) VALUES
('Mi Evento 1', '2026-04-01', 'Lugar 1', 'ACTIVO'),
-- ...
;

-- Generar 100 entradas para evento 1
INSERT INTO entradas (codigo_qr, evento_id, nombre_cliente, estado)
SELECT 
  'EV1-' || LPAD((ROW_NUMBER() OVER ())::text, 5, '0'),
  1,
  'Cliente ' || ROW_NUMBER() OVER (),
  'DISPONIBLE'
FROM generate_series(1, 100);
```

Ejecutar:
```bash
psql -U postgres -d caja_entradas -f seed-more-data.sql
```

---

## 🔄 Próxima Semana: Mejoras

### 1️⃣ Escaneo Real de QR (30 min)

**En `src/routes/validar/+page.svelte`:**

Actualizadamente cambiar el input manual por escaneo real:

```javascript
import { html5QrcodeScanner } from 'html5-qrcode';

let scanner;

onMount(() => {
  scanner = new html5QrcodeScanner('reader', {
    fps: 10,
    qrbox: { width: 250, height: 250}
  });
  
  scanner.render(onScanSuccess, onScanFailure);
});

function onScanSuccess(decodedText) {
  // decodedText es el código QR
  // llamar a validar API automaticamente
  validarEntrada(decodedText);
}
```

### 2️⃣ API para Crear Usuarios (20 min)

**Crear** `src/routes/api/usuarios/+server.ts`:

```typescript
export async function POST({ request, locals }) {
  if (locals.user?.rol !== 'ADMIN') {
    return json({ error: 'Permiso denegado' }, { status: 403 });
  }
  
  const { nombre, email, password, rol } = await request.json();
  
  const hashedPassword = await hashPassword(password);
  
  const result = await sql`
    INSERT INTO usuarios (nombre, email, password, rol, estado)
    VALUES (${nombre}, ${email}, ${hashedPassword}, ${rol}, 'ACTIVO')
    RETURNING id, nombre, email, rol;
  `;
  
  return json(result[0], { status: 201 });
}
```

Luego agregar página para crear usuarios:
`src/routes/usuarios/crear/+page.svelte`

### 3️⃣ Notificaciones por Email (45 min)

**Instalar:**
```bash
npm install nodemailer
```

**Crear servicio:**
```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer';

export async function sendVentaConfirmation(email, venta) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  await transporter.sendMail({
    to: email,
    subject: `Venta confirmada #${venta.id}`,
    html: `<h1>Venta de $${venta.total}</h1><p>Gracias por su compra</p>`
  });
}
```

### 4️⃣ Export a CSV/PDF (1 hora)

**Para CSV:**
```javascript
function exportToCSV(data, filename) {
  const csv = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

**Para PDF:**
```bash
npm install jspdf
```

---

## 🎓 Mes 1: Nuevas Características

- [ ] Panel de administrador avanzado
- [ ] Gráficos de ventas (chart.js)
- [ ] Búsqueda avanzada de productos
- [ ] Filtros en reportes
- [ ] Soporte multi-moneda
- [ ] Descuentos por cliente/bulto
- [ ] Historial de cambios de precio
- [ ] Auditoría de acciones
- [ ] Backup automático
- [ ] Soporte PWA (offline)

---

## 🚀 Antes de Producción

### Checklist Final
- [ ] Database password no es `postgres`
- [ ] JWT_SECRET es único y largo (64+ chars)
- [ ] Test con carga (100+ concurrentes)
- [ ] Backup automático configurado
- [ ] SSL/HTTPS habilitado
- [ ] Rate limiting activado
- [ ] Logs centralizados (optional)
- [ ] Error tracking (Sentry, optional)
- [ ] Email transaccional funciona
- [ ] SMS alertas (optional)

### Deploy a Producción

**Opción 1: Vercel (Recomendado para SvelteKit)**
```bash
npm i -g vercel
vercel --prod
```

**Opción 2: Railway, Render, Heroku**
- Conecta GitHub
- Auto deploy en cada push

**Opción 3: Tu servidor**
- Build: `npm run build`
- Ejecutar: `node build`
- PM2: `pm2 start build -i max --name "entradas-ya"`

---

## 📞 Recursos

**Documentación Interna:**
- Endpoint queries: Ver `API-REFERENCE.md`
- Testing: Ver `TESTING.md`
- Troubleshooting: Ver `TESTING.md` + `README.md`

**Librerías Externas:**
- SvelteKit: https://kit.svelte.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- bcryptjs: npm docs
- JWT: https://jwt.io/
- QR Code: https://github.com/davidshimjs/qrcode.js

---

## Preguntas Comunes

**P: ¿Cómo agrego nuevos productos rápido?**
R: Usa la UI desde PRODUCTOS o SQL via psql

**P: ¿Cómo cambio contraseñas?**
R: SQL directo (ver SETUP.md para bcryptjs)

**P: ¿Cómo veo logs?**
R: Terminal donde corre `npm run dev`, o database logs en psql

**P: ¿Qué pasa si reinicio el servidor?**
R: Todos los datos persisten en PostgreSQL, sesiones se pierden (OK)

**P: ¿Puedo usar esto en producción?**
R: Sí, pero hazle los checks del checklist de arriba primero

---

## 📊 Métricas de Éxito

```
Semana 1:  Setup completo + testing manual
Semana 2:  Scaneo QR real + API usuarios
Semana 3:  Notificaciones + exports
Semana 4:  Gráficos + análisis + pulido

Mes 1:    Sistema robusto y escalable
Mes 2-3:  Usuarios testing en vivo
Mes 3+:   Deploy producción
```

---

**¡El sistema está listo! Ahora a disfrutar construyendo sobre esta base sólida.**

Cualquier duda, revisa los archivos de documentación. ¿Cuando comienzas?
