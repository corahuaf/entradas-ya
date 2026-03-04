import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// GET: Ver estado de la BD
export const GET: RequestHandler = async () => {
	try {
		const tablesCheck = await sql`
			SELECT table_name FROM information_schema.tables 
			WHERE table_name IN ('entradas', 'productos', 'ventas_bebidas')
		`;

		const tables = tablesCheck.map((t: any) => t.table_name);
		
		let productoCount = 0;
		if (tables.includes('productos')) {
			const count = await sql`SELECT COUNT(*) as count FROM productos`;
			productoCount = count[0].count;
		}

		return json({
			status: 'ok',
			tables: {
				entradas: tables.includes('entradas'),
				productos: tables.includes('productos'),
				ventas_bebidas: tables.includes('ventas_bebidas')
			},
			productoCount,
			initialized: tables.length === 3 && productoCount > 0
		});
	} catch (error) {
		console.error('Error checando BD:', error);
		return json({ status: 'error', initialized: false }, { status: 500 });
	}
};

// POST: Inicializar la BD
export const POST: RequestHandler = async () => {
	try {
		// Crear tabla de productos si no existe
		await sql`
			CREATE TABLE IF NOT EXISTS productos (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				nombre VARCHAR(255) NOT NULL,
				precio DECIMAL(10, 2) NOT NULL,
				stock INT DEFAULT 0,
				activo BOOLEAN DEFAULT TRUE,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`;

		// Verificar si la tabla ventas_bebidas tiene las nuevas columnas
		const columnCheck = await sql`
			SELECT column_name FROM information_schema.columns 
			WHERE table_name = 'ventas_bebidas' AND column_name = 'metodo_pago'
		`;

		if (columnCheck.length === 0) {
			// Agregar columnas si no existen
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS producto_id UUID`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10, 2)`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS vuelto DECIMAL(10, 2)`;
			await sql`ALTER TABLE ventas_bebidas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo'`;
		}

		// Insertar productos por defecto
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
				SELECT ${prod.nombre}, ${prod.precio}, 50, true
				WHERE NOT EXISTS (
					SELECT 1 FROM productos WHERE nombre = ${prod.nombre}
				)
			`;
		}

		return json({
			success: true,
			message: 'Base de datos inicializada correctamente',
			productsAdded: productosData.length
		});
	} catch (error) {
		console.error('Error inicializando BD:', error);
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
