-- Crear tabla de entradas
CREATE TABLE IF NOT EXISTS entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_asistente VARCHAR(255) NOT NULL,
    validada BOOLEAN DEFAULT FALSE,
    fecha_validacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de ventas de bebidas
CREATE TABLE IF NOT EXISTS ventas_bebidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrada_id UUID REFERENCES entradas(id) ON DELETE SET NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    producto VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    monto_recibido DECIMAL(10, 2),
    vuelto DECIMAL(10, 2),
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    fecha TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_entradas_validada ON entradas(validada);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas_bebidas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_entrada ON ventas_bebidas(entrada_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, precio, stock) VALUES
('Cerveza (Mediana)', 8.00, 50),
('Cerveza (Grande)', 12.00, 50),
('Agua', 2.00, 100),
('Refresco', 3.00, 100),
('Vino Tinto', 15.00, 30),
('Ron', 20.00, 25),
('Whiskey', 25.00, 20)
ON CONFLICT DO NOTHING;
