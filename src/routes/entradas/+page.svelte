<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/Navbar.svelte';
	import QRCode from 'qrcode';
	import { jsPDF } from 'jspdf';

	let user: any = null;
	let eventos: any[] = [];
	let loading = false;
	let error = '';
	let success = '';

	let eventoId = '';
	let nombreCliente = '';
	let entrada: any = null;
	let entradasRecientes: any[] = [];
	let deletingId: number | null = null;
	let qrDataUrl = '';
	let fondoDataUrl = '';

	onMount(async () => {
		const res = await fetch('/api/auth/me');
		const data = await res.json();
		if (!data.user || !['ADMIN'].includes(data.user.rol)) {
			goto('/');
			return;
		}
		user = data.user;
		await Promise.all([loadEventos(), loadFondoEntrada(), loadEntradasRecientes()]);
	});

	async function loadFondoEntrada() {
		try {
			const res = await fetch('/entrada.png');
			if (!res.ok) return;
			const blob = await res.blob();
			fondoDataUrl = await blobToDataUrl(blob);
		} catch (err) {
			// If image load fails, PDF is generated with a plain fallback background.
			fondoDataUrl = '';
		}
	}

	function blobToDataUrl(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result || ''));
			reader.onerror = () => reject(new Error('No se pudo leer la imagen de fondo'));
			reader.readAsDataURL(blob);
		});
	}

	async function loadEventos() {
		try {
			const res = await fetch('/api/eventos');
			const data = await res.json();
			if (data.success) {
				eventos = data.eventos;
			}
		} catch (err) {
			error = 'Error al cargar eventos';
		}
	}

	async function loadEntradasRecientes() {
		try {
			const res = await fetch('/api/entradas?limit=20', { credentials: 'include' });
			const data = await res.json();
			if (data.success) {
				entradasRecientes = data.entradas;
			}
		} catch (err) {
			error = 'Error al cargar entradas recientes';
		}
	}

	async function crearEntrada() {
		error = '';
		success = '';
		entrada = null;
		qrDataUrl = '';

		if (!eventoId || !nombreCliente.trim()) {
			error = 'Selecciona un evento e ingresa el nombre del cliente';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/entradas', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					evento_id: parseInt(eventoId),
					nombre_cliente: nombreCliente.trim()
				})
			});

			const data = await res.json();
			if (data.success) {
				entrada = data.entrada;
				success = 'Entrada creada. Descarga el PDF.';
				await loadEntradasRecientes();
				qrDataUrl = await QRCode.toDataURL(entrada.codigo_qr, {
					width: 220,
					margin: 1
				});
			} else {
				error = data.message || 'Error al crear entrada';
			}
		} catch (err) {
			error = 'Error al crear entrada';
		} finally {
			loading = false;
		}
	}

	async function eliminarEntrada(id: number) {
		const confirmar = confirm('¿Seguro que deseas eliminar esta entrada?');
		if (!confirmar) return;

		loading = true;
		deletingId = id;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/entradas', {
				method: 'DELETE',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			const data = await res.json();
			if (data.success) {
				success = 'Entrada eliminada exitosamente';
				if (entrada && entrada.id === id) {
					entrada = null;
					qrDataUrl = '';
				}
				await loadEntradasRecientes();
			} else {
				error = data.message || 'Error al eliminar entrada';
			}
		} catch (err) {
			error = 'Error al eliminar entrada';
		} finally {
			loading = false;
			deletingId = null;
		}
	}

	function descargarPDF() {
		if (!entrada || !qrDataUrl) return;

		const doc = new jsPDF({ unit: 'mm', format: 'a4' });
		const pageWidth = 210;
		const pageHeight = 297;

		const ticketX = 20;
		const ticketY = 16;
		const ticketWidth = 170;
		const ticketHeight = 102;

		doc.setFillColor(248, 248, 248);
		doc.rect(0, 0, pageWidth, pageHeight, 'F');

		doc.setDrawColor(210, 210, 210);
		doc.setLineWidth(0.4);
		doc.rect(ticketX, ticketY, ticketWidth, ticketHeight);

		if (fondoDataUrl) {
			doc.addImage(fondoDataUrl, 'PNG', ticketX, ticketY, ticketWidth, ticketHeight);
		} else {
			doc.setFillColor(25, 25, 25);
			doc.rect(ticketX, ticketY, ticketWidth, ticketHeight, 'F');
		}

		const qrBoxX = ticketX + ticketWidth - 47;
		const qrBoxY = ticketY + ticketHeight - 47;

		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text('CLIENTE:', qrBoxX, qrBoxY - 16);
		doc.setFont('helvetica', 'normal');
		doc.text(entrada.nombre_cliente, qrBoxX, qrBoxY - 11);

		doc.setDrawColor(255, 255, 255);
		doc.setLineWidth(0.4);
		doc.rect(qrBoxX, qrBoxY, 39, 39);
		doc.addImage(qrDataUrl, 'PNG', qrBoxX + 1, qrBoxY + 1, 37, 37);

		doc.setTextColor(40, 40, 40);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.text('TERMINOS Y CONDICIONES', 20, 142);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		const terminos = [
			'1. Esta entrada es valida solo para el evento y fecha indicados.',
			'2. Presentar documento de identidad junto con este ticket.',
			'3. No se permiten cambios ni devoluciones, salvo cancelacion del evento.',
			'4. Se prohibe la reventa o duplicacion del codigo QR.',
			'5. El organizador puede negar el ingreso por incumplimiento de normas.'
		];
		doc.text(terminos, 20, 150, { maxWidth: 170, lineHeightFactor: 1.45 });

		doc.setDrawColor(190, 190, 190);
		(doc as any).setLineDash([2, 2], 0);
		doc.line(20, 128, 190, 128);
		(doc as any).setLineDash([], 0);

		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		doc.text(`Fecha de compra: ${new Date().toLocaleDateString()}`, 20, pageHeight - 15);
		doc.text('Generado automaticamente por Entradas YA', 20, pageHeight - 10);

		doc.save(`entrada-${entrada.codigo_qr}.pdf`);
	}
</script>

{#if user}
	<Navbar {user} />

	<div class="container">
		<h1>🎫 CREAR ENTRADA</h1>

		{#if error}
			<div class="alert error">{error}</div>
		{/if}

		{#if success}
			<div class="alert success">{success}</div>
		{/if}

		<div class="form-box">
			<div class="form-group">
				<label for="evento-select">Evento</label>
				<select id="evento-select" bind:value={eventoId}>
					<option value="" disabled>Selecciona un evento</option>
					{#each eventos as evento (evento.id)}
						<option value={evento.id}>{evento.nombre}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="cliente-input">Nombre del cliente</label>
				<input
					id="cliente-input"
					placeholder="Nombre completo"
					bind:value={nombreCliente}
					maxlength="100"
				/>
			</div>

			<div class="form-buttons">
				<button class="btn btn-save" on:click={crearEntrada} disabled={loading}>
					{loading ? 'Creando...' : 'Crear Entrada'}
				</button>
			</div>
		</div>

		{#if entrada}
			<div class="preview">
				<h2>Pre-entrada</h2>
				<div class="preview-card">
					<div class="preview-info">
						<p><strong>Cliente:</strong> {entrada.nombre_cliente}</p>
						<p><strong>Codigo:</strong> {entrada.codigo_qr}</p>
					</div>
					{#if qrDataUrl}
						<img src={qrDataUrl} alt="QR" />
					{/if}
				</div>
				<button class="btn btn-download" on:click={descargarPDF}>Descargar PDF</button>
			</div>
		{/if}

		<div class="preview">
			<h2>Entradas recientes generadas</h2>
			{#if entradasRecientes.length === 0}
				<p class="empty">No hay entradas registradas.</p>
			{:else}
				<div class="tabla-container">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Cliente</th>
								<th>Evento</th>
								<th>Estado</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{#each entradasRecientes as item (item.id)}
								<tr>
									<td>#{item.id}</td>
									<td>{item.nombre_cliente}</td>
									<td>{item.evento_nombre}</td>
									<td>{item.estado}</td>
									<td>
										<button
											class="btn btn-delete"
											on:click={() => eliminarEntrada(item.id)}
											disabled={loading || deletingId === item.id || item.estado === 'VALIDADO'}
										>
											{deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #333;
		margin: 20px 0;
	}

	.alert {
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 15px;
	}

	.alert.error {
		background: #fee;
		color: #c33;
	}

	.alert.success {
		background: #efe;
		color: #2e7d32;
	}

	.form-box {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.form-group {
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-weight: 600;
		color: #555;
		font-size: 13px;
	}

	input,
	select {
		padding: 10px;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 14px;
	}

	.form-buttons {
		display: flex;
		justify-content: flex-end;
	}

	.btn {
		padding: 10px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-save {
		background: #667eea;
		color: white;
	}

	.preview {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-top: 20px;
	}

	.preview-card {
		display: flex;
		gap: 20px;
		align-items: center;
		justify-content: space-between;
		margin: 12px 0 16px;
		padding: 12px;
		border: 1px dashed #ccc;
		border-radius: 6px;
	}

	.preview-card img {
		width: 120px;
		height: 120px;
	}

	.btn-download {
		background: #2d3436;
		color: white;
	}

	.tabla-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 10px;
	}

	th,
	td {
		padding: 10px;
		text-align: left;
		border-bottom: 1px solid #eee;
		font-size: 14px;
	}

	th {
		font-size: 12px;
		text-transform: uppercase;
		color: #666;
	}

	.empty {
		color: #777;
		margin: 0;
	}

	.btn-delete {
		background: #d63031;
		color: #fff;
		padding: 8px 12px;
		font-size: 12px;
	}
</style>
