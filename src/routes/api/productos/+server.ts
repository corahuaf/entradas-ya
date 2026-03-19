import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const productos = await sql`
			SELECT id, nombre, precio, stock, estado 
			FROM productos 
			WHERE estado = 'ACTIVO'
			ORDER BY nombre ASC
		`;

		return json({ success: true, productos });
	} catch (error) {
		console.error('Error obteniendo productos:', error);
		return json(
			{ success: false, message: 'Error al obtener productos' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Validar autenticación y rol
	if (!locals.user || !['ADMIN', 'CAJERO'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { nombre, precio, stock } = await request.json();

		if (!nombre || precio === undefined || stock === undefined) {
			return json(
				{ success: false, message: 'Datos requeridos: nombre, precio, stock' },
				{ status: 400 }
			);
		}

		const resultado = await sql`
			INSERT INTO productos (nombre, precio, stock, estado)
			VALUES (${nombre}, ${precio}, ${stock}, 'ACTIVO')
			RETURNING id, nombre, precio, stock, estado
		`;

		return json({
			success: true,
			message: 'Producto creado exitosamente',
			producto: resultado[0]
		});
	} catch (error) {
		console.error('Error creando producto:', error);
		return json(
			{ success: false, message: 'Error al crear producto' },
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { id, nombre, precio, stock, estado } = await request.json();

		if (!id) {
			return json(
				{ success: false, message: 'ID requerido' },
				{ status: 400 }
			);
		}

		let query = `UPDATE productos SET `;
		const updates: string[] = [];
		const params: any[] = [];

		if (nombre !== undefined) updates.push(`nombre = $${params.length + 1}`), params.push(nombre);
		if (precio !== undefined) updates.push(`precio = $${params.length + 1}`), params.push(precio);
		if (stock !== undefined) updates.push(`stock = $${params.length + 1}`), params.push(stock);
		if (estado !== undefined) updates.push(`estado = $${params.length + 1}`), params.push(estado);

		if (updates.length === 0) {
			return json(
				{ success: false, message: 'No hay campos para actualizar' },
				{ status: 400 }
			);
		}

		params.push(id);
		const updateQuery = `${query}${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;

		const resultado = await sql.unsafe(updateQuery, params);

		return json({
			success: true,
			message: 'Producto actualizado exitosamente',
			producto: resultado[0]
		});
	} catch (error) {
		console.error('Error actualizando producto:', error);
		return json(
			{ success: false, message: 'Error al actualizar producto' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['ADMIN'].includes(locals.user.rol)) {
		return json(
			{ success: false, message: 'No autorizado' },
			{ status: 401 }
		);
	}

	try {
		const { id } = await request.json();

		if (!id) {
			return json(
				{ success: false, message: 'ID requerido' },
				{ status: 400 }
			);
		}

		// Cambiar estado a INACTIVO en lugar de eliminar
		await sql`
			UPDATE productos 
			SET estado = 'INACTIVO'
			WHERE id = ${id}
		`;

		return json({ success: true, message: 'Producto desactivado exitosamente' });
	} catch (error) {
		console.error('Error desactivando producto:', error);
		return json(
			{ success: false, message: 'Error al desactivar producto' },
			{ status: 500 }
		);
	}
};
