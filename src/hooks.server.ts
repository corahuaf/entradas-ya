import { redirect } from '@sveltejs/kit';
import { verifyToken, getTokenFromCookie } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';

/**
 * Handle global para manejar autenticación
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Extraer token de cookies
	const token = getTokenFromCookie(event.request.headers.get('cookie'));

	if (token) {
		const user = verifyToken(token);
		if (user) {
			event.locals.user = user;
		}
	}

	const response = await resolve(event);
	return response;
};

/**
 * Middleware para proteger rutas
 */
export function requireAuth(user: any) {
	if (!user) {
		throw redirect(303, '/login');
	}
}

/**
 * Middleware para verificar rol específico
 */
export function requireRole(user: any, allowedRoles: string[]) {
	if (!user) {
		throw redirect(303, '/login');
	}

	if (!allowedRoles.includes(user.rol)) {
		throw redirect(303, '/');
	}
}
