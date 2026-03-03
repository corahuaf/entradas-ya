import { sql } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { qr_id } = (await request.json()) as { qr_id: string };

	if (!qr_id) {
		return json({ success: false, message: 'QR ID es requerido' }, { status: 400 });
	}

	try {
		const result = await sql`SELECT * FROM entradas WHERE id = ${qr_id}`;

		if (result.length === 0) {
			return json({ success: false, message: 'QR No registrado' }, { status: 404 });
		}

		const entrada = result[0];
		if (entrada.validada) {
			return json({ success: false, message: 'Ya ingresó anteriormente' }, { status: 409 });
		}

		await sql`UPDATE entradas SET validada = true, fecha_validacion = NOW() WHERE id = ${qr_id}`;

		return json({
			success: true,
			message: `Bienvenido/a ${entrada.nombre_asistente}`
		});
	} catch (e) {
		console.error('Error en validación:', e);
		return json({ success: false, message: 'Error de servidor' }, { status: 500 });
	}
};
