import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/reportes/ventas-dia - Ventas del día
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !['ADMIN', 'CAJERO'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const tipo = url.searchParams.get('tipo') || 'ventas-dia';

		if (tipo === 'ventas-dia') {
			const ventas = await sql`
				SELECT 
					DATE(v.fecha) as fecha,
					COUNT(*) as cantidad_ventas,
					SUM(v.total) as total,
					v.metodo_pago,
					u.nombre as usuario
				FROM ventas v
				JOIN usuarios u ON v.usuario_id = u.id
				WHERE DATE(v.fecha) = CURRENT_DATE AND v.estado = 'COMPLETADA'
				GROUP BY DATE(v.fecha), v.metodo_pago, u.nombre
				ORDER BY u.nombre
			`;

			return json({ success: true, tipo, datos: ventas });
		}

		if (tipo === 'productos-vendidos') {
			const productos = await sql`
				SELECT 
					p.nombre,
					p.id,
					SUM(dv.cantidad) as cantidad_vendida,
					SUM(dv.subtotal) as total_vendido
				FROM detalle_venta dv
				JOIN productos p ON dv.producto_id = p.id
				JOIN ventas v ON dv.venta_id = v.id
				WHERE DATE(v.fecha) = CURRENT_DATE AND v.estado = 'COMPLETADA'
				GROUP BY p.id, p.nombre
				ORDER BY cantidad_vendida DESC
			`;

			return json({ success: true, tipo, datos: productos });
		}

		if (tipo === 'entradas-validadas') {
			const entradas = await sql`
				SELECT 
					DATE(e.fecha_validacion) as fecha,
					COUNT(*) as cantidad_validadas,
					ev.nombre as evento
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				WHERE DATE(e.fecha_validacion) = CURRENT_DATE AND e.estado = 'VALIDADO'
				GROUP BY DATE(e.fecha_validacion), ev.nombre
			`;

			return json({ success: true, tipo, datos: entradas });
		}

		if (tipo === 'entradas-disponibles') {
			const entradas = await sql`
				SELECT 
					ev.nombre as evento,
					COUNT(*) as disponibles,
					(SELECT COUNT(*) FROM entradas WHERE evento_id = ev.id) as total
				FROM entradas e
				JOIN eventos ev ON e.evento_id = ev.id
				WHERE e.estado = 'DISPONIBLE'
				GROUP BY ev.id, ev.nombre
			`;

			return json({ success: true, tipo, datos: entradas });
		}

		return json(
			{ success: false, message: 'Tipo de reporte no válido' },
			{ status: 400 }
		);
	} catch (error) {
		console.error('Error obteniendo reportes:', error);
		return json(
			{ success: false, message: 'Error al obtener reportes' },
			{ status: 500 }
		);
	}
};
