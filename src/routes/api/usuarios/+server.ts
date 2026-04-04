import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import { hashPassword } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

const ROLES_VALIDOS = ['ADMIN', 'CAJERO', 'CONTROL_ENTRADAS'] as const;
const ESTADOS_VALIDOS = ['ACTIVO', 'INACTIVO'] as const;

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.rol !== 'ADMIN') {
		return json({ success: false, message: 'No autorizado' }, { status: 401 });
	}

	try {
		const usuarios = await sql`
			SELECT id, nombre, email, rol, estado, fecha_creacion
			FROM usuarios
			ORDER BY id DESC
		`;

		return json({ success: true, usuarios });
	} catch (error) {
		console.error('Error obteniendo usuarios:', error);
		return json({ success: false, message: 'Error al obtener usuarios' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.rol !== 'ADMIN') {
		return json({ success: false, message: 'No autorizado' }, { status: 401 });
	}

	try {
		const { nombre, email, password, rol } = await request.json();

		if (!nombre || !email || !password || !rol) {
			return json({ success: false, message: 'Todos los campos son obligatorios' }, { status: 400 });
		}

		if (!ROLES_VALIDOS.includes(rol)) {
			return json({ success: false, message: 'Rol inválido' }, { status: 400 });
		}

		if (String(password).length < 6) {
			return json(
				{ success: false, message: 'La contraseña debe tener al menos 6 caracteres' },
				{ status: 400 }
			);
		}

		const emailNormalizado = String(email).trim().toLowerCase();
		const nombreNormalizado = String(nombre).trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailNormalizado)) {
			return json({ success: false, message: 'Email inválido' }, { status: 400 });
		}

		const existente = await sql`
			SELECT id, email, nombre
			FROM usuarios
			WHERE email = ${emailNormalizado} OR nombre = ${nombreNormalizado}
			LIMIT 1
		`;

		if (existente.length > 0) {
			return json(
				{ success: false, message: 'Ya existe un usuario con ese nombre o email' },
				{ status: 409 }
			);
		}

		const passwordHash = await hashPassword(String(password));

		const nuevoUsuario = await sql`
			INSERT INTO usuarios (nombre, email, password, rol, estado)
			VALUES (${nombreNormalizado}, ${emailNormalizado}, ${passwordHash}, ${rol}, 'ACTIVO')
			RETURNING id, nombre, email, rol, estado, fecha_creacion
		`;

		return json({
			success: true,
			message: 'Usuario creado correctamente',
			usuario: nuevoUsuario[0]
		});
	} catch (error) {
		console.error('Error creando usuario:', error);
		return json({ success: false, message: 'Error al crear usuario' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.rol !== 'ADMIN') {
		return json({ success: false, message: 'No autorizado' }, { status: 401 });
	}

	try {
		const { id, estado } = await request.json();
		const userId = Number(id);

		if (!Number.isInteger(userId) || userId <= 0) {
			return json({ success: false, message: 'ID de usuario inválido' }, { status: 400 });
		}

		if (!ESTADOS_VALIDOS.includes(estado)) {
			return json({ success: false, message: 'Estado inválido' }, { status: 400 });
		}

		if (userId === Number(locals.user.id) && estado === 'INACTIVO') {
			return json(
				{ success: false, message: 'No puedes anular tu propio usuario' },
				{ status: 400 }
			);
		}

		const actualizado = await sql`
			UPDATE usuarios
			SET estado = ${estado}, fecha_actualizacion = CURRENT_TIMESTAMP
			WHERE id = ${userId}
			RETURNING id, nombre, email, rol, estado, fecha_creacion
		`;

		if (actualizado.length === 0) {
			return json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
		}

		return json({
			success: true,
			message: estado === 'INACTIVO' ? 'Usuario anulado' : 'Usuario reactivado',
			usuario: actualizado[0]
		});
	} catch (error) {
		console.error('Error actualizando estado de usuario:', error);
		return json({ success: false, message: 'Error al actualizar usuario' }, { status: 500 });
	}
};
