import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		// Verificar tabla entradas
		const entradaExists = await sql`
			SELECT EXISTS(
				SELECT 1 FROM information_schema.tables 
				WHERE table_name = 'entradas'
			);
		`;

		// Verificar tabla ventas_bebidas
		const ventasExists = await sql`
			SELECT EXISTS(
				SELECT 1 FROM information_schema.tables 
				WHERE table_name = 'ventas_bebidas'
			);
		`;

		// Contar registros en cada tabla
		let entradaCount = 0;
		let ventasCount = 0;

		if (entradaExists[0].exists) {
			const entCount = await sql`SELECT COUNT(*) as count FROM entradas`;
			entradaCount = entCount[0].count;
		}

		if (ventasExists[0].exists) {
			const ventCount = await sql`SELECT COUNT(*) as count FROM ventas_bebidas`;
			ventasCount = ventCount[0].count;
		}

		return json({
			status: 'ok',
			tables: {
				entradas: {
					exists: entradaExists[0].exists,
					records: entradaCount
				},
				ventas_bebidas: {
					exists: ventasExists[0].exists,
					records: ventasCount
				}
			}
		});
	} catch (error) {
		console.error('Database check error:', error);
		return json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
			tables: {
				entradas: { exists: false, records: 0 },
				ventas_bebidas: { exists: false, records: 0 }
			}
		}, { status: 500 });
	}
};
