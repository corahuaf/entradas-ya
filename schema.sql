-- Crear tabla de entradas
CREATE TABLE IF NOT EXISTS entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_asistente VARCHAR(255) NOT NULL,
    validada BOOLEAN DEFAULT FALSE,
    fecha_validacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de ventas de bebidas
CREATE TABLE IF NOT EXISTS ventas_bebidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrada_id UUID REFERENCES entradas(id) ON DELETE SET NULL,
    producto VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_entradas_validada ON entradas(validada);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas_bebidas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_entrada ON ventas_bebidas(entrada_id);
