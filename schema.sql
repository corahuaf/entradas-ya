-- Schema para Sistema de Caja y Validación de Entradas
-- Optimizado para eventos con soporte multi-rol

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'CAJERO', 'CONTROL_ENTRADAS')),
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: VENTAS
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'YAPE', 'PLIN', 'TARJETA')),
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'CANCELADA')),
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DETALLE_VENTA
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_venta (
  id SERIAL PRIMARY KEY,
  venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INT NOT NULL REFERENCES productos(id),
  cantidad INT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- TABLA: EVENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  lugar VARCHAR(150) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ENTRADAS
-- ============================================
CREATE TABLE IF NOT EXISTS entradas (
  id SERIAL PRIMARY KEY,
  codigo_qr VARCHAR(100) NOT NULL UNIQUE,
  evento_id INT NOT NULL REFERENCES eventos(id),
  nombre_cliente VARCHAR(100) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'VALIDADO', 'ANULADO')),
  fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_validacion TIMESTAMP NULL,
  usuario_validador_id INT REFERENCES usuarios(id)
);

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta ON detalle_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_entradas_codigo_qr ON entradas(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_entradas_evento ON entradas(evento_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estado ON entradas(estado);

-- ============================================
-- DATOS INICIALES
-- ============================================
-- Insertar usuario admin por defecto (contraseña temporal: admin123 - cambiar en producción)
INSERT INTO usuarios (nombre, email, password, rol, estado) 
VALUES ('Administrador', 'admin@sistema.local', '', 'ADMIN', 'ACTIVO')
ON CONFLICT (email) DO NOTHING;

-- Insertar evento de prueba
INSERT INTO eventos (nombre, fecha, lugar, estado) 
VALUES ('Evento de Prueba', CURRENT_DATE, 'Sede Principal', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, precio, stock, estado) 
VALUES 
  ('Entrada General', 50.00, 500, 'ACTIVO'),
  ('Entrada VIP', 100.00, 100, 'ACTIVO'),
  ('Bebida - Agua', 5.00, 200, 'ACTIVO'),
  ('Bebida - Gaseosa', 8.00, 150, 'ACTIVO'),
  ('Bebida - Cerveza', 12.00, 100, 'ACTIVO')
ON CONFLICT DO NOTHING;
