import { json } from '@sveltejs/kit';
import { sql } from '$lib/db';
import { verifyPassword, generateToken, hashPassword } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { nombre, password } = await request.json();

		if (!nombre || !password) {
			return json(
				{ success: false, message: 'Nombre y contraseña son requeridos' },
				{ status: 400 }
			);
		}

		// Buscar usuario por nombre
		const usuarios = await sql`
			SELECT id, nombre, email, password, rol, estado FROM usuarios 
			WHERE nombre = ${nombre} AND estado = 'ACTIVO'
		`;

		if (usuarios.length === 0) {
			return json(
				{ success: false, message: 'Credenciales inválidas' },
				{ status: 401 }
			);
		}

		const usuario = usuarios[0];

		// Verificar contraseña
		const passwordValid = await verifyPassword(password, usuario.password);
		if (!passwordValid) {
			return json(
				{ success: false, message: 'Credenciales inválidas' },
				{ status: 401 }
			);
		}

		// Generar token
		const token = generateToken({
			id: usuario.id,
			nombre: usuario.nombre,
			email: usuario.email,
			rol: usuario.rol,
			estado: usuario.estado
		});

		// Guardar token en cookie
		cookies.set('auth_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 // 24 horas
		});

		return json({
			success: true,
			message: 'Login exitoso',
			user: {
				id: usuario.id,
				nombre: usuario.nombre,
				email: usuario.email,
				rol: usuario.rol
			}
		});
	} catch (error) {
		console.error('Error en login:', error);
		return json(
			{ success: false, message: 'Error en el servidor' },
			{ status: 500 }
		);
	}
};
