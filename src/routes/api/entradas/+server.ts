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
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
		const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

		const where: string[] = [];
		const params: any[] = [];

		if (evento_id) {
			const eventoIdNum = parseInt(evento_id);
			if (!Number.isNaN(eventoIdNum)) {
				params.push(eventoIdNum);
				where.push(`e.evento_id = $${params.length}`);
			}
		}

		if (estado) {
			params.push(estado);
			where.push(`e.estado = $${params.length}`);
		}

		if (search) {
			params.push(`%${search}%`);
			where.push(`(e.codigo_qr ILIKE $${params.length} OR e.nombre_cliente ILIKE $${params.length})`);
		}

		params.push(limit);
		const limitIndex = params.length;
		params.push(offset);
		const offsetIndex = params.length;

		const query = `
			SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado,
				   e.fecha_compra, e.fecha_validacion, e.usuario_validador_id,
				   ev.nombre as evento_nombre,
				   u.nombre as usuario_validador
			FROM entradas e
			JOIN eventos ev ON e.evento_id = ev.id
			LEFT JOIN usuarios u ON e.usuario_validador_id = u.id
			${where.length ? `WHERE ${where.join(' AND ')}` : ''}
			ORDER BY e.fecha_compra DESC
			LIMIT $${limitIndex} OFFSET $${offsetIndex}
		`;

		const entradas = await sql.unsafe(query, params);

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
