import { sql } from '$lib/db';
import type { PageServerLoad } from './$types';

interface Stats {
	total: number;
}

interface VentasRow {
	recaudado: number;
	cantidad: number;
}

export const load: PageServerLoad = async () => {
	try {
		const asistentes = await sql`SELECT COUNT(*) as total FROM entradas WHERE validada = true`;
		const ventas = await sql`SELECT COALESCE(SUM(precio), 0) as recaudado, COUNT(*) as cantidad FROM ventas_bebidas`;

		return {
			totalAsistentes: Number(asistentes[0]?.total) || 0,
			recaudado: Number(ventas[0]?.recaudado) || 0,
			totalVentas: Number(ventas[0]?.cantidad) || 0
		};
	} catch (e) {
		console.error('Error al cargar datos del admin:', e);
		return {
			totalAsistentes: 0,
			recaudado: 0,
			totalVentas: 0
		};
	}
};
