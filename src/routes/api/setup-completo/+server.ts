import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	try {
		// Paso 1: Eliminar y recrear tabla de productos garantizando la estructura correcta
		await sql`DROP TABLE IF EXISTS productos CASCADE`;

		await sql`
			CREATE TABLE productos (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				nombre VARCHAR(255) NOT NULL UNIQUE,
				precio DECIMAL(10, 2) NOT NULL,
				stock INT DEFAULT 0,
				activo BOOLEAN DEFAULT TRUE,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`;

		// Paso 2: Insertar productos por defecto
		const productosData = [
			{ nombre: 'Cerveza (Mediana)', precio: 8.0 },
			{ nombre: 'Cerveza (Grande)', precio: 12.0 },
			{ nombre: 'Agua', precio: 2.0 },
			{ nombre: 'Refresco', precio: 3.0 },
			{ nombre: 'Vino Tinto', precio: 15.0 },
			{ nombre: 'Ron', precio: 20.0 },
			{ nombre: 'Whiskey', precio: 25.0 }
		];

		for (const prod of productosData) {
			await sql`
				INSERT INTO productos (nombre, precio, stock, activo)
				VALUES (${prod.nombre}, ${prod.precio}, 50, true)
			`;
		}

		// Paso 3: Verificar que estén todos
		const productosCheck = await sql`
			SELECT id, nombre, precio, activo FROM productos ORDER BY nombre
		`;

		// Paso 4: Asegurar que ventas_bebidas tiene las columnas necesarias
		const columnCheck = await sql`
			SELECT column_name FROM information_schema.columns 
			WHERE table_name = 'ventas_bebidas' AND column_name = 'monto_recibido'
		`;

		if (columnCheck.length === 0) {
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS producto_id UUID`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10, 2)`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS vuelto DECIMAL(10, 2)`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo'`;
		}

		return json({
			success: true,
			message: 'Base de datos completamente reinicializada',
			productosInsertados: productosCheck.length,
			productos: productosCheck
		});
	} catch (error) {
		console.error('Error en setup completo:', error);
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
			error: String(error)
		}, { status: 500 });
	}
};
