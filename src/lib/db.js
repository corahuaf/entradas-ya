import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

// Exportamos la instancia 'sql' para usarla en archivos +server.js o +page.server.js
export const sql = neon(DATABASE_URL);
