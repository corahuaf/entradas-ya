import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

interface VentaPayload {
	entrada_id: string | null;
	producto: string;
	precio: number;
}

export const POST: RequestHandler = async ({ request }) => {
	const { entrada_id, producto, precio } = (await request.json()) as VentaPayload;

	if (!producto || precio === undefined || precio < 0) {
		return json({ success: false, message: 'Datos inválidos' }, { status: 400 });
	}

	try {
		await sql`
			INSERT INTO ventas_bebidas (entrada_id, producto, precio, fecha)
			VALUES (${entrada_id}, ${producto}, ${precio}, NOW())
		`;
		return json({ success: true, message: 'Venta registrada' });
	} catch (e) {
		console.error('Error al registrar venta:', e);
		return json({ success: false, message: 'Error al registrar venta' }, { status: 500 });
	}
};
