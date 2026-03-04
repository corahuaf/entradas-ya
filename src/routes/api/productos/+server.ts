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

		// Si la columna no existe, crearla
		if (columnExists.length === 0) {
			await sql`
				ALTER TABLE productos 
				ADD COLUMN activo BOOLEAN DEFAULT TRUE
			`;
		}

		// Obtener TODOS los productos (sin filtrar por activo)
		const productos = await sql`
			SELECT id, nombre, precio FROM productos 
			ORDER BY nombre ASC
		`;

		return json({ success: true, productos });
	} catch (error) {
		console.error('Error obteniendo productos:', error);
		return json({ success: false, message: 'Error al obtener productos' }, { status: 500 });
	}
};
