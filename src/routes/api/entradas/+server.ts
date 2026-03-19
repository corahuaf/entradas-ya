import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * POST /api/entradas - Crear nuevas entradas
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { evento_id, nombre_cliente, codigo_qr } = await request.json();

		if (!evento_id || !nombre_cliente) {
			return json(
				{ success: false, message: 'Datos requeridos: evento_id, nombre_cliente' },
				{ status: 400 }
			);
		}

		// Verificar que el evento exista
		const evento = await sql`SELECT id FROM eventos WHERE id = ${evento_id}`;
		if (evento.length === 0) {
			return json(
				{ success: false, message: 'Evento no encontrado' },
				{ status: 404 }
			);
		}

		const codigoGenerado =
			codigo_qr && String(codigo_qr).trim().length > 0
				? String(codigo_qr).trim()
				: `EV${evento_id}-${randomUUID()}`;

		const entrada = await sql`
			INSERT INTO entradas (codigo_qr, evento_id, nombre_cliente, estado)
			VALUES (${codigoGenerado}, ${evento_id}, ${nombre_cliente}, 'DISPONIBLE')
			RETURNING id, codigo_qr, evento_id, nombre_cliente, estado, fecha_compra
		`;

		return json({
			success: true,
			message: 'Entrada creada exitosamente',
			entrada: entrada[0]
		});
	} catch (error) {
		console.error('Error creando entrada:', error);
		return json(
			{ success: false, message: 'Error al crear entrada' },
			{ status: 500 }
		);
	}
};

/**
 * GET /api/entradas - Listar entradas
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const evento_id = url.searchParams.get('evento_id');
		const estado = url.searchParams.get('estado');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let entradas: any[] = [];

		if (evento_id && estado) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${parseInt(evento_id)} AND e.estado = ${estado}
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (evento_id) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${parseInt(evento_id)}
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (estado) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.estado = ${estado}
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		}

		return json({ success: true, entradas });
	} catch (error) {
		console.error('Error obteniendo entradas:', error);
		return json(
			{ success: false, message: 'Error al obtener entradas' },
			{ status: 500 }
		);
	}
};
