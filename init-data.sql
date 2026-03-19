-- Archivo de inicialización con datos de prueba
-- Ejecutar después de schema.sql

-- ============================================
-- USUARIOS DE PRUEBA
-- ============================================
-- Contraseña: admin123 (hasheada con bcryptjs con 10 salts)
-- Hash: $2a$10$sI8Qr1DZi2OaTj0o6LAZneasMlzVDEZs2.aLnQODVpS9iMUZU9te

-- Insertar usuario ADMIN
UPDATE usuarios 
SET password = '$2a$10$sI8Qr1DZi2OaTj0o6LAZneasMlzVDEZs2.aLnQODVpS9iMUZU9te'
WHERE email = 'admin@sistema.local';

-- Insertar usuario CAJERO
INSERT INTO usuarios (nombre, email, password, rol, estado) 
VALUES ('Juan Pérez (Cajero)', 'juan@sistema.local', '$2a$10$sI8Qr1DZi2OaTj0o6LAZneasMlzVDEZs2.aLnQODVpS9iMUZU9te', 'CAJERO', 'ACTIVO')
ON CONFLICT (email) DO NOTHING;

-- Insertar usuario CONTROL DE ENTRADAS
INSERT INTO usuarios (nombre, email, password, rol, estado) 
VALUES ('María García (Control)', 'maria@sistema.local', '$2a$10$sI8Qr1DZi2OaTj0o6LAZneasMlzVDEZs2.aLnQODVpS9iMUZU9te', 'CONTROL_ENTRADAS', 'ACTIVO')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PRODUCTOS COMPLETOS
-- ============================================
DELETE FROM detalle_venta;
DELETE FROM ventas;
DELETE FROM productos WHERE nombre NOT LIKE 'Entrada%';

INSERT INTO productos (nombre, precio, stock, estado) VALUES
-- Entradas
('Entrada General', 50.00, 500, 'ACTIVO'),
('Entrada VIP', 100.00, 100, 'ACTIVO'),
('Entrada Estudiante', 25.00, 50, 'ACTIVO'),

-- Bebidas
('Agua (500ml)', 5.00, 200, 'ACTIVO'),
('Gaseosa (500ml)', 8.00, 150, 'ACTIVO'),
('Jugo Natural', 10.00, 100, 'ACTIVO'),
('Cerveza Rubia (350ml)', 12.00, 80, 'ACTIVO'),
('Cerveza Negra (350ml)', 12.00, 60, 'ACTIVO'),
('Vino Tinto (Copa)', 15.00, 40, 'ACTIVO'),
('Vino Blanco (Copa)', 15.00, 40, 'ACTIVO'),

-- Comidas
('Sándwich Clásico', 20.00, 100, 'ACTIVO'),
('Hamburguesa', 25.00, 80, 'ACTIVO'),
('Hot Dog', 15.00, 120, 'ACTIVO'),
('Completo', 18.00, 100, 'ACTIVO'),
('Empanada (un)', 8.00, 150, 'ACTIVO'),
('Papas Fritas', 12.00, 100, 'ACTIVO'),

-- Snacks
('Maní', 5.00, 200, 'ACTIVO'),
('Palomitas', 10.00, 100, 'ACTIVO'),
('Chocolate', 8.00, 150, 'ACTIVO'),
('Chicles (paquete)', 6.00, 100, 'ACTIVO')

ON CONFLICT DO NOTHING;

-- ============================================
-- EVENTOS DE PRUEBA
-- ============================================
DELETE FROM entradas;
DELETE FROM eventos;

INSERT INTO eventos (nombre, fecha, lugar, estado) VALUES
('Concierto Rock', CURRENT_DATE + INTERVAL '7 days', 'Estadio Principal', 'ACTIVO'),
('Festival de Música', CURRENT_DATE + INTERVAL '14 days', 'Parque Central', 'ACTIVO'),
('Partida de Fútbol', CURRENT_DATE + INTERVAL '3 days', 'Cancha Municipal', 'ACTIVO'),
('Teatro - Romeo y Julieta', CURRENT_DATE + INTERVAL '5 days', 'Teatro Nacional', 'ACTIVO'),
('Conferencia Tech', CURRENT_DATE + INTERVAL '1 days', 'Centro de Convenciones', 'ACTIVO');

-- ============================================
-- ENTRADAS DE PRUEBA (para primer evento)
-- ============================================
-- Obtener el evento más reciente
INSERT INTO entradas (codigo_qr, evento_id, nombre_cliente, estado) 
SELECT 
  'EV' || ev.id || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY e) :: text, 5, '0'),
  ev.id,
  'Cliente ' || ROW_NUMBER() OVER (ORDER BY e),
  (ARRAY['DISPONIBLE', 'DISPONIBLE', 'DISPONIBLE', 'DISPONIBLE', 'VALIDADO'])[ROW_NUMBER() OVER (ORDER BY e) % 5 + 1]
FROM (SELECT 1 as e) e
CROSS JOIN (SELECT id FROM eventos ORDER BY id LIMIT 1) ev
CROSS JOIN LATERAL generate_series(1, 20) gs
ON CONFLICT (codigo_qr) DO NOTHING;

-- ============================================
-- VENTAS DE PRUEBA (últimas 5 días)
-- ============================================
INSERT INTO ventas (fecha, total, metodo_pago, usuario_id, estado)
SELECT 
  CURRENT_TIMESTAMP - INTERVAL '1 day' * random() * 5,
  ROUND((RANDOM() * 500 + 50)::numeric, 2),
  (ARRAY['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'])[FLOOR(RANDOM() * 4) + 1],
  (SELECT id FROM usuarios WHERE rol = 'CAJERO' LIMIT 1),
  'COMPLETADA'
FROM generate_series(1, 10);

-- ============================================
-- DETALLES DE VENTA DE PRUEBA
-- ============================================
INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio, subtotal)
SELECT 
  v.id,
  p.id,
  FLOOR(RANDOM() * 5 + 1)::int,
  p.precio,
  p.precio * FLOOR(RANDOM() * 5 + 1),
  'COMPLETADA'
FROM ventas v
CROSS JOIN LATERAL (
  SELECT id, precio FROM productos 
  WHERE estado = 'ACTIVO' 
  ORDER BY RANDOM() 
  LIMIT FLOOR(RANDOM() * 3 + 1)::int
) p
WHERE v.estado = 'COMPLETADA'
ON CONFLICT DO NOTHING;

-- ============================================
-- CONFIRMACIÓN
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM productos) as total_productos,
  (SELECT COUNT(*) FROM eventos) as total_eventos,
  (SELECT COUNT(*) FROM entradas) as total_entradas,
  (SELECT COUNT(*) FROM ventas) as total_ventas;
