import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/entradas/[codigo_qr] - Buscar entrada por código
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { codigo_qr } = params;

		const entradas = await sql`
			SELECT e.id, e.codigo_qr, e.evento_id, e.nombre_cliente, e.estado, 
				   e.fecha_compra, e.fecha_validacion, ev.nombre as evento_nombre
			FROM entradas e
			JOIN eventos ev ON e.evento_id = ev.id
			WHERE e.codigo_qr = ${codigo_qr}
		`;

		if (entradas.length === 0) {
			return json(
				{ success: false, message: 'Entrada no encontrada' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			entrada: entradas[0]
		});
	} catch (error) {
		console.error('Error buscando entrada:', error);
		return json(
			{ success: false, message: 'Error al buscar entrada' },
			{ status: 500 }
		);
	}
};

/**
 * PUT /api/entradas/[codigo_qr] - Validar entrada
 */
export const PUT: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !['ADMIN', 'CONTROL_ENTRADAS'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { codigo_qr } = params;

		// Buscar entrada
		const entradas = await sql`
			SELECT id, estado FROM entradas WHERE codigo_qr = ${codigo_qr}
		`;

		if (entradas.length === 0) {
			return json(
				{ success: false, message: 'Entrada no encontrada' },
				{ status: 404 }
			);
		}

		const entrada = entradas[0];

		// Verificar si ya fue validada
		if (entrada.estado === 'VALIDADO') {
			return json({
				success: false,
				message: 'Entrada ya utilizada',
				entrada: entrada
			});
		}

		// Validar entrada
		const resultado = await sql`
			UPDATE entradas 
			SET estado = 'VALIDADO', 
				fecha_validacion = CURRENT_TIMESTAMP,
				usuario_validador_id = ${locals.user.id}
			WHERE codigo_qr = ${codigo_qr}
			RETURNING id, codigo_qr, nombre_cliente, estado, fecha_validacion
		`;

		return json({
			success: true,
			message: 'Entrada validada exitosamente',
			entrada: resultado[0]
		});
	} catch (error) {
		console.error('Error validando entrada:', error);
		return json(
			{ success: false, message: 'Error al validar entrada' },
			{ status: 500 }
		);
	}
};
