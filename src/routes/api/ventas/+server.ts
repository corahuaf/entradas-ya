import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN', 'CAJERO'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { total, metodo_pago, items } = await request.json();

		if (!total || !metodo_pago || !items || items.length === 0) {
			return json(
				{ success: false, message: 'Datos requeridos incompletos' },
				{ status: 400 }
			);
		}

		// Validar método de pago
		const metodosValidos = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'];
		if (!metodosValidos.includes(metodo_pago)) {
			return json(
				{ success: false, message: 'Método de pago inválido' },
				{ status: 400 }
			);
		}

		// Crear venta
		const venta = await sql`
			INSERT INTO ventas (total, metodo_pago, usuario_id, estado)
			VALUES (${total}, ${metodo_pago}, ${locals.user.id}, 'COMPLETADA')
			RETURNING id
		`;

		const ventaId = venta[0].id;

		// Insertar detalles de venta y actualizar stock
		for (const item of items) {
			const productoId = item.producto_id ?? item.id;
			const cantidad = Number(item.cantidad) || 0;
			const precio = Number(item.precio) || 0;
			const subtotal = item.subtotal !== undefined ? Number(item.subtotal) : cantidad * precio;

			if (!productoId || cantidad <= 0 || precio <= 0) {
				return json(
					{ success: false, message: 'Detalle de venta inválido' },
					{ status: 400 }
				);
			}

			// Insertar detalle
			await sql`
				INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio, subtotal)
				VALUES (${ventaId}, ${productoId}, ${cantidad}, ${precio}, ${subtotal})
			`;

			// Actualizar stock
			await sql`
				UPDATE productos 
				SET stock = stock - ${cantidad}
				WHERE id = ${productoId}
			`;
		}

		return json({
			success: true,
			message: 'Venta registrada exitosamente',
			ventaId
		});
	} catch (error) {
		console.error('Error registrando venta:', error);
		return json(
			{ success: false, message: 'Error al registrar venta' },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const ventaIdParam = url.searchParams.get('ventaId');

		if (ventaIdParam) {
			const ventaId = parseInt(ventaIdParam, 10);

			if (Number.isNaN(ventaId)) {
				return json(
					{ success: false, message: 'ID de venta inválido' },
					{ status: 400 }
				);
			}

			const venta = await sql`
				SELECT
					v.id,
					v.fecha,
					v.total,
					v.metodo_pago,
					v.estado,
					u.nombre as usuario_nombre
				FROM ventas v
				JOIN usuarios u ON v.usuario_id = u.id
				WHERE v.id = ${ventaId}
				LIMIT 1
			`;

			if (venta.length === 0) {
				return json(
					{ success: false, message: 'Venta no encontrada' },
					{ status: 404 }
				);
			}

			const detalles = await sql`
				SELECT
					dv.id,
					dv.producto_id,
					p.nombre as producto_nombre,
					dv.cantidad,
					dv.precio,
					dv.subtotal
				FROM detalle_venta dv
				JOIN productos p ON dv.producto_id = p.id
				WHERE dv.venta_id = ${ventaId}
				ORDER BY dv.id ASC
			`;

			return json({ success: true, venta: venta[0], detalles });
		}

		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		const ventas = await sql`
			SELECT 
				v.id, 
				v.fecha, 
				v.total, 
				v.metodo_pago,
				u.nombre as usuario_nombre,
				v.estado
			FROM ventas v
			JOIN usuarios u ON v.usuario_id = u.id
			ORDER BY v.fecha DESC
			LIMIT ${limit} OFFSET ${offset}
		`;

		return json({ success: true, ventas });
	} catch (error) {
		console.error('Error obteniendo ventas:', error);
		return json(
			{ success: false, message: 'Error al obtener ventas' },
			{ status: 500 }
		);
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN', 'CAJERO'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { ventaId } = await request.json();
		const ventaIdNum = Number(ventaId);

		if (!Number.isInteger(ventaIdNum) || ventaIdNum <= 0) {
			return json(
				{ success: false, message: 'ID de venta inválido' },
				{ status: 400 }
			);
		}

		const venta = await sql`
			SELECT id, estado
			FROM ventas
			WHERE id = ${ventaIdNum}
			LIMIT 1
		`;

		if (venta.length === 0) {
			return json(
				{ success: false, message: 'Venta no encontrada' },
				{ status: 404 }
			);
		}

		if (venta[0].estado === 'CANCELADA') {
			return json(
				{ success: false, message: 'La venta ya está cancelada' },
				{ status: 409 }
			);
		}

		const result = await sql`
			WITH venta_actualizada AS (
				UPDATE ventas
				SET estado = 'CANCELADA', fecha_actualizacion = CURRENT_TIMESTAMP
				WHERE id = ${ventaIdNum} AND estado = 'COMPLETADA'
				RETURNING id
			),
			stock_repuesto AS (
				UPDATE productos p
				SET stock = p.stock + dv.cantidad
				FROM detalle_venta dv
				JOIN venta_actualizada va ON va.id = dv.venta_id
				WHERE p.id = dv.producto_id
				RETURNING p.id
			)
			SELECT COUNT(*)::int AS ventas_actualizadas FROM venta_actualizada
		`;

		if (!result[0] || result[0].ventas_actualizadas === 0) {
			return json(
				{ success: false, message: 'No se pudo anular la venta' },
				{ status: 409 }
			);
		}

		return json({
			success: true,
			message: 'Venta anulada y stock repuesto'
		});
	} catch (error) {
		console.error('Error anulando venta:', error);
		return json(
			{ success: false, message: 'Error al anular venta' },
			{ status: 500 }
		);
	}
};
