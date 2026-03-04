import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		// Verificar si la columna 'activo' existe
		const columnExists = await sql`
			SELECT column_name FROM information_schema.columns 
			WHERE table_name = 'productos' AND column_name = 'activo'
		`;

		// Si no existe, crearla
		if (columnExists.length === 0) {
			await sql`
				ALTER TABLE productos 
				ADD COLUMN activo BOOLEAN DEFAULT TRUE
			`;
		}

		const productos = await sql`
			SELECT id, nombre, precio, activo FROM productos
		`;

		const productosActivos = await sql`
			SELECT id, nombre, precio FROM productos 
			WHERE activo = true 
			ORDER BY nombre ASC
		`;

		return json({
			total: productos.length,
			totales: productos,
			activos: productosActivos.length,
			productosActivos
		});
	} catch (error) {
		console.error('Error obteniendo productos:', error);
		return json({ 
			error: error instanceof Error ? error.message : 'Error desconocido',
			total: 0,
			activos: 0
		}, { status: 500 });
	}
};
