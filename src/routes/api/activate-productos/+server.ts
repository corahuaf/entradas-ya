import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	try {
		// Activar todos los productos
		const result = await sql`
			UPDATE productos 
			SET activo = true 
			WHERE activo = false
		`;

		// Obtener el estado actual
		const productos = await sql`
			SELECT id, nombre, precio, activo FROM productos
		`;

		const activos = await sql`
			SELECT COUNT(*) as count FROM productos WHERE activo = true
		`;

		return json({
			success: true,
			message: 'Productos activados',
			totalProductos: productos.length,
			productosActivos: activos[0].count,
			productos: productos
		});
	} catch (error) {
		console.error('Error activando productos:', error);
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
