import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const productos = await sql`
			SELECT id, nombre, precio FROM productos 
			WHERE activo = true 
			ORDER BY nombre ASC
		`;
		return json({ success: true, productos });
	} catch (error) {
		console.error('Error obteniendo productos:', error);
		return json({ success: false, message: 'Error al obtener productos' }, { status: 500 });
	}
};
