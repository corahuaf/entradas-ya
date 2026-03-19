import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	// Eliminar cookie de autenticación
	cookies.delete('auth_token', {
		path: '/'
	});

	return json({ success: true, message: 'Logout exitoso' });
};
