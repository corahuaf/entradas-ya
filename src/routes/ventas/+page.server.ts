import { sql } from '$lib/db';
import type { PageServerLoad } from './$types';

interface VentasRow {
	id: string;
	entrada_id: string | null;
	producto: string;
	precio: number;
	fecha: string;
	nombre_asistente: string | null;
}

interface Totales {
	cantidad_ventas: number;
	recaudacion_total: number | null;
	promedio: number | null;
}

export const load: PageServerLoad = async () => {
	try {
		// Obtenemos los datos de bebidas vendidas
		const ventas = await sql`
			SELECT 
				vb.id,
				vb.entrada_id,
				vb.producto,
				vb.precio,
				vb.fecha,
				e.nombre_asistente
			FROM ventas_bebidas vb
			LEFT JOIN entradas e ON vb.entrada_id = e.id
			ORDER BY vb.fecha DESC
		`;

		const totalesResult = await sql`
			SELECT 
				COUNT(*) as cantidad_ventas,
				COALESCE(SUM(precio), 0) as recaudacion_total,
				COALESCE(AVG(precio), 0) as promedio
			FROM ventas_bebidas
		`;

		const totales = totalesResult[0] || { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 };

		// Convertir strings a números si es necesario
		return {
			ventas: (ventas || []) as VentasRow[],
			totales: {
				cantidad_ventas: Number(totales.cantidad_ventas) || 0,
				recaudacion_total: Number(totales.recaudacion_total) || 0,
				promedio: Number(totales.promedio) || 0
			}
		};
	} catch (error) {
		console.error('Error cargando ventas:', error);
		return {
			ventas: [],
			totales: { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 }
		};
	}
};
