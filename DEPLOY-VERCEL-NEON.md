# 🚀 DEPLOY A VERCEL + NEON (Producción)

## ✅ Estado: Listo para Producción

El código **ya está optimizado** para Neon (serverless PostgreSQL).

- ✅ Usa `@neondatabase/serverless` driver
- ✅ Queries con prepared statements (seguro)
- ✅ SvelteKit con `adapter-auto` (automático Vercel)
- ✅ Environment variables configuradas
- ✅ Sin dependencias de servidor local

---

## 3 PASOS PARA PRODUCCIÓN

### Paso 1: Crear Base de Datos en Neon (5 min)

1. Ve a https://neon.tech/
2. Sign up (gratis)
3. Crea un nuevo proyecto
4. En dashboard, copia la **Connection String**:
   ```
   postgresql://user:password@ep-xxxxx.neon.tech/nominaldb?sslmode=require
   ```
5. **Guarda este URL** (lo necesitarás en Vercel)

---

### Paso 2: Setup Database Schema en Neon (5 min)

**Opción A: Via Neon SQL Editor (Fácil)**

1. En Neon dashboard → "SQL Editor"
2. Copia todo de `schema.sql`
3. Pega en SQL editor
4. Click "Execute"
5. Copia todo de `init-data.sql`
6. Pega y ejecuta
7. ✅ Listo

**Opción B: Via CLI (Si quieres terminal)**

```bash
# Instala Neon CLI
npm install -g neon

# Login
neon auth

# Ejecutar schema
cat schema.sql | neon sql

# Ejecutar datos
cat init-data.sql | neon sql
```

---

### Paso 3: Desplegar a Vercel (10 min)

#### 3.1 Sube tu código a GitHub

Si no lo has hecho:

```bash
cd e:\boletos\entradas-ya

# Inicializa git (si no existe)
git init

# Agrega todo
git add .

# Primer commit
git commit -m "Initial commit - Sistema POS completo"

# Crea repo en GitHub (https://github.com/new)
# Luego:
git remote add origin https://github.com/TU_USER/entradas-ya.git
git branch -M main
git push -u origin main
```

#### 3.2 Desplega en Vercel

1. Ve a https://vercel.com/
2. Click "New Project"
3. Selecciona tu repo `entradas-ya`
4. Vercel detecta que es SvelteKit automáticamente ✅
5. Click "Deploy"

**Eso es todo.** Vercel:
- ✅ Detecta SvelteKit
- ✅ Corre `npm run build`
- ✅ Usa `adapter-auto` para Vercel
- ✅ Listo en 2-3 minutos

#### 3.3 Configura DATABASE_URL en Vercel

1. En Vercel dashboard → Tu proyecto
2. Settings → Environment Variables
3. Agrega nueva:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://user:pass@ep-xxxxx.neon.tech/db?sslmode=require`
4. Click "Save"
5. Redeploy proyecto (Settings → Deployments → Redeploy)

---

## ✅ VERIFICACIÓN: Sistema en Producción

### Checklist Final

- [ ] Neon database creada
- [ ] schema.sql ejecutado en Neon
- [ ] init-data.sql ejecutado en Neon
- [ ] GitHub repo creado
- [ ] Vercel despliegue exitoso
- [ ] DATABASE_URL en Vercel env vars
- [ ] Proyecto redeployado

### Testing en Producción

**Tu URL será algo como:**
```
https://tu-dominio.vercel.app/login
```

Prueba:

1. Abre https://tu-dominio.vercel.app/login
2. Login: `admin@sistema.local` / `admin123`
3. Prueba CAJA:
   - Selecciona un producto
   - Click "Cobrar"
   - Deberías ver confirmación
4. Verifica BD en Neon:
   ```
   SELECT COUNT(*) FROM ventas;  -- Debería ser 1+
   ```

---

## 🎯 Características en Producción

```
✅ Auto-scaling     (Vercel cuida el traffic)
✅ Global CDN       (Rápido en todo el mundo)
✅ SSL/HTTPS        (Vercel lo da gratis)
✅ Database serverless (Neon escala automático)
✅ Uptime 99.9%     (Garantizado)
✅ Logs en Vercel   (debugging fácil)
✅ Auto-deployments (Push a GitHub = deploy)
```

---

## 💰 Costos Aproximados (Free Tier)

```
Vercel          Gratis (primer proyecto)
Neon            Gratis hasta 10GB almacenamiento
                Free tier suficiente para MVP startup
```

**Si creces:** Vercel $20/mes, Neon $15/mes (escalable)

---

## 🔧 Configuración Avanzada (Opcional)

### Auto-deploy en cada push a GitHub

**Ya está configurado en Vercel automáticamente.**

Cuando hagas:
```bash
git push origin main
```

Vercel automáticamente:
1. Descarga código
2. Corre `npm run build`
3. Deploya
4. En 2-3 minutos está vivo

### Monitoreo de Producción

**En Vercel dashboard:**
- Logs en tiempo real
- Performance metrics
- Error tracking
- Database query stats

**En Neon dashboard:**
- Query analytics
- Storage usage
- Connection pool stats

### Domain Custom (Opcional)

1. Compra dominio (ej. entradas-ya.com)
2. En Vercel → Project Settings → Domains
3. Agrega tu dominio
4. Sigue instrucciones DNS
5. En 5-10 min: https://entradas-ya.com funciona

---

## ⚠️ Troubleshooting Producción

### "Database connection error"

**Solución:**
1. Verifica DATABASE_URL en Vercel env vars
2. Copia exactamente de Neon (incluir ?sslmode=require)
3. Redeploy
4. Espera 1 minuto

### "Build fails en Vercel"

**Solución:**
1. Verifica que `npm run build` funciona localmente
2. Revisa logs en Vercel → Deployments → Logs
3. Usualmente falta una variable de env
4. Arregla en Vercel settings y redeploy

### "Schema no está en Neon"

**Solución:**
1. Abre Neon SQL Editor
2. Verifica que las tablas existan:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. Si faltan, ejecuta schema.sql nuevamente

### "Datos de prueba no están"

En Neon SQL Editor:
```sql
SELECT COUNT(*) FROM usuarios;      -- Debería ser 3
SELECT COUNT(*) FROM productos;     -- Debería ser 20
SELECT COUNT(*) FROM entradas;      -- Debería ser 400+
```

Si falta alguno, ejecuta init-data.sql

---

## 📊 Comparación: Local vs Producción

| Aspecto | Local | Vercel + Neon |
|---------|-------|---------------|
| Setup | 5 min (script) | 15 min (3 pasos) |
| PostgreSQL | Local | Neon (cloud) |
| Hosting | Tu PC | Vercel (global) |
| Uptime | 24/7 si dejas PC | 99.9% garantizado |
| Costo | Gratis | Gratis (free tier) |
| Escala | Limitado por PC | Automático |
| HTTPS | No | Gratis |
| Deploy | Manual | Auto (Git push) |

---

## ✅ Ya está LISTO

**El código NO necesita cambios.** Todo está configurado para:

- ✅ SvelteKit (`adapter-auto`)
- ✅ Neon (`@neondatabase/serverless`)
- ✅ Vercel (detecta automáticamente)
- ✅ Environment variables (standar)
- ✅ HTTPS (gratis en Vercel)
- ✅ Auto-deploy (Git integration)

**Solo necesitas:**
1. Neon database + schema
2. Vercel deployment
3. DATABASE_URL env var

**Estimated time: 30 minutos total**

---

## 🚀 Quick Deploy Checklist

```bash
# 0. Verificación local (si quieres)
npm run build
npm run preview

# 1. Crear Neon database
# → https://neon.tech (5 min)

# 2. Ejecutar schema en Neon
# → Copy-paste schema.sql en SQL editor (5 min)

# 3. Git push
git add .
git commit -m "Ready for production"
git push origin main

# 4. Deploy en Vercel
# → https://vercel.com/new (auto-detects SvelteKit)

# 5. Env vars en Vercel
# → DATABASE_URL = neon_connection_string

# 6. Redeploy
# → Settings → Redeploy

# Espera 2-3 minutos...
# ✅ LIVE en https://tu-proyecto.vercel.app
```

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| "¿Cómo copiaste schema.sql en Neon?" | Neon → SQL Editor → Paste → Execute |
| "¿Qué es DATABASE_URL?" | Connection string que Neon te da en dashboard |
| "¿Vercel detecta SvelteKit?" | Sí, automáticamente con adapter-auto |
| "¿Necesito SSL?" | Vercel lo proporciona gratis |
| "¿Puedo custom domain?" | Sí, Settings → Domains |

---

## 🎉 ¡YA ESTÁ!

Tu sistema está en producción. Ahora puedes:

- Compartir URL con usuarios
- Escalar sin problemas
- Dormir sin dejar servidor prendido
- Actualizar código: `git push` y automático deploy

**Tiempo total: ~30 minutos. Resultados: Sistema en el aire 24/7.**

---

**Última actualización: Marzo 15, 2026**  
**Estado: ✅ Listo para producción**
