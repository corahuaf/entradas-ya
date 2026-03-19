import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

const databaseUrl = env.DATABASE_URL;

// Exportamos la instancia 'sql' para usarla en archivos +server.js o +page.server.js
export const sql = databaseUrl
	? neon(databaseUrl)
	: (() => {
		throw new Error('DATABASE_URL is not set');
	});
