import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		// Verificar directamente desde la BD
		const productosDB = await sql`
			SELECT id, nombre, precio, activo FROM productos ORDER BY nombre
		`;

		console.log('Productos en BD:', productosDB);

		const productosActivos = await sql`
			SELECT id, nombre, precio FROM productos 
			WHERE activo = true 
			ORDER BY nombre ASC
		`;

		console.log('Productos activos:', productosActivos);

		return json({
			success: true,
			totales: productosDB.length,
			activos: productosActivos.length,
			productosDB,
			productosActivos
		});
	} catch (error) {
		console.error('Error en test:', error);
		return json({ 
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
