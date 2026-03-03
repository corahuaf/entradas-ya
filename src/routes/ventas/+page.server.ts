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
	// Obtenemos los datos de bebidas vendidas
	const ventas = (await sql`
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
	`) as VentasRow[];

	const totales = (await sql`
		SELECT 
			COUNT(*) as cantidad_ventas,
			SUM(precio) as recaudacion_total,
			AVG(precio) as promedio
		FROM ventas_bebidas
	`) as Totales[];

	return {
		ventas: ventas || [],
		totales: totales[0] || { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 }
	};
};
