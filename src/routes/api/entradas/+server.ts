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
		const search = (url.searchParams.get('search') || '').trim();
		const parsedLimit = parseInt(url.searchParams.get('limit') || '50');
		const parsedOffset = parseInt(url.searchParams.get('offset') || '0');
		const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 200);
		const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);
		const eventoIdNum = evento_id ? parseInt(evento_id) : null;
		const hasEvento = eventoIdNum !== null && !Number.isNaN(eventoIdNum);
		const hasEstado = Boolean(estado);
		const hasSearch = Boolean(search);
		const searchLike = `%${search}%`;

		let entradas: any[] = [];

		if (hasEvento && hasEstado && hasSearch) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${eventoIdNum} AND e.estado = ${estado}
				  AND (e.codigo_qr ILIKE ${searchLike} OR e.nombre_cliente ILIKE ${searchLike})
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasEvento && hasEstado) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${eventoIdNum} AND e.estado = ${estado}
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasEvento && hasSearch) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${eventoIdNum}
				  AND (e.codigo_qr ILIKE ${searchLike} OR e.nombre_cliente ILIKE ${searchLike})
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasEstado && hasSearch) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.estado = ${estado}
				  AND (e.codigo_qr ILIKE ${searchLike} OR e.nombre_cliente ILIKE ${searchLike})
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasEvento) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.evento_id = ${eventoIdNum}
				ORDER BY e.fecha_compra DESC
				LIMIT ${limit} OFFSET ${offset}
			`;
		} else if (hasEstado) {
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
		} else if (hasSearch) {
			entradas = await sql`
				SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
					   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
					   ev.nombre as evento_nombre,
					   u.nombre as usuario_validador
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
				WHERE e.codigo_qr ILIKE ${searchLike} OR e.nombre_cliente ILIKE ${searchLike}
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

/**
 * DELETE /api/entradas - Eliminar entrada por id
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { id } = await request.json();
		const entradaId = Number(id);

		if (!entradaId || Number.isNaN(entradaId)) {
			return json(
				{ success: false, message: 'ID de entrada requerido' },
				{ status: 400 }
			);
		}

		const entradas = await sql`
			SELECT id, estado, codigo_qr
			FROM entradas
			WHERE id = ${entradaId}
		`;

		if (entradas.length === 0) {
			return json(
				{ success: false, message: 'Entrada no encontrada' },
				{ status: 404 }
			);
		}

		if (entradas[0].estado === 'VALIDADO') {
			return json(
				{ success: false, message: 'No se puede eliminar una entrada validada' },
				{ status: 409 }
			);
		}

		await sql`
			DELETE FROM entradas
			WHERE id = ${entradaId}
		`;

		return json({
			success: true,
			message: 'Entrada eliminada exitosamente'
		});
	} catch (error) {
		console.error('Error eliminando entrada:', error);
		return json(
			{ success: false, message: 'Error al eliminar entrada' },
			{ status: 500 }
		);
	}
};
