import { sql } from '$lib/db';
import type { PageServerLoad } from './$types';

interface VentasRow {
	id: string;
	entrada_id: string | null;
	producto: string;
	precio: number;
	fecha: string;
	nombre_asistente: string | null;
	monto_recibido: number | null;
	vuelto: number | null;
	metodo_pago: string;
}

interface Totales {
	cantidad_ventas: number;
	recaudacion_total: number | null;
	promedio: number | null;
}

interface Producto {
	id: string;
	nombre: string;
	precio: number;
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
				e.nombre_asistente,
				vb.monto_recibido,
				vb.vuelto,
				vb.metodo_pago
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

		const productos = await sql`
			SELECT id, nombre, precio FROM productos 
			WHERE activo = true 
			ORDER BY nombre ASC
		`;

		const totales = totalesResult[0] || { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 };

		// Convertir strings a números si es necesario
		return {
			ventas: (ventas || []) as VentasRow[],
			productos: (productos || []) as Producto[],
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
			productos: [],
			totales: { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 }
		};
	}
};
