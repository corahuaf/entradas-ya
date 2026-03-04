import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

interface VentaPayload {
	entrada_id: string | null;
	producto_id: string | null;
	producto: string;
	precio: number;
	monto_recibido?: number;
	vuelto?: number;
	metodo_pago?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	const { entrada_id, producto_id, producto, precio, monto_recibido, vuelto, metodo_pago } =
		(await request.json()) as VentaPayload;

	if (!producto || precio === undefined || precio < 0) {
		return json({ success: false, message: 'Datos inválidos' }, { status: 400 });
	}

	try {
		await sql`
			INSERT INTO ventas_bebidas (entrada_id, producto_id, producto, precio, monto_recibido, vuelto, metodo_pago, fecha)
			VALUES (${entrada_id}, ${producto_id}, ${producto}, ${precio}, ${monto_recibido || null}, ${vuelto || null}, ${metodo_pago || 'efectivo'}, NOW())
		`;
		return json({ success: true, message: 'Venta registrada' });
	} catch (error) {
		console.error('Error al registrar venta:', error);
		return json({ success: false, message: 'Error al registrar venta' }, { status: 500 });
	}
};
