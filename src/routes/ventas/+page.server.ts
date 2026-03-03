import { sql } from '$lib/db';

export async function load() {
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

	const totales = await sql`
		SELECT 
			COUNT(*) as cantidad_ventas,
			SUM(precio) as recaudacion_total,
			AVG(precio) as promedio
		FROM ventas_bebidas
	`;

	return {
		ventas: ventas || [],
		totales: totales[0] || { cantidad_ventas: 0, recaudacion_total: 0, promedio: 0 }
	};
}

export async function POST({ request }) {
	const { entrada_id, producto, precio } = await request.json();

	try {
		await sql`
			INSERT INTO ventas_bebidas (entrada_id, producto, precio, fecha)
			VALUES (${entrada_id}, ${producto}, ${precio}, NOW())
		`;
		return new Response(JSON.stringify({ success: true, message: 'Venta registrada' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 200
		});
	} catch {
		return new Response(JSON.stringify({ success: false, message: 'Error al registrar venta' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500
		});
	}
}
