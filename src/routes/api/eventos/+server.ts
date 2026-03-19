import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const eventos = await sql`
			SELECT id, nombre, fecha, lugar, estado
			FROM eventos
			WHERE estado IN ('ACTIVO', 'FINALIZADO')
			ORDER BY fecha DESC
		`;

		return json({ success: true, eventos });
	} catch (error) {
		console.error('Error obteniendo eventos:', error);
		return json(
			{ success: false, message: 'Error al obtener eventos' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { nombre, fecha, lugar } = await request.json();

		if (!nombre || !fecha || !lugar) {
			return json(
				{ success: false, message: 'Datos requeridos: nombre, fecha, lugar' },
				{ status: 400 }
			);
		}

		const evento = await sql`
			INSERT INTO eventos (nombre, fecha, lugar, estado)
			VALUES (${nombre}, ${fecha}, ${lugar}, 'ACTIVO')
			RETURNING id, nombre, fecha, lugar, estado
		`;

		return json({
			success: true,
			message: 'Evento creado exitosamente',
			evento: evento[0]
		});
	} catch (error) {
		console.error('Error creando evento:', error);
		return json(
			{ success: false, message: 'Error al crear evento' },
			{ status: 500 }
		);
	}
};
